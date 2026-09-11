const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys')

const fs = require('fs')
const path = require('path')
const pino = require('pino')

// One active bot socket per WhatsApp number.
const sessions = new Map()

// Temporary pairing sockets are kept separate from the active session.
const pairingSockets = new Map()

// Prevent duplicate socket creation.
const creating = new Map()

// Prevent duplicate /pair requests for the same number.
const pairingRequests = new Map()

// The main app registers the message handler here. Every socket created
// (pairing, normal login, reconnect, or startup restore) receives it.
let socketHandler = null

function setSocketHandler(handler) {
    socketHandler = typeof handler === 'function' ? handler : null
    console.log(`🔗 SOCKET HANDLER ${socketHandler ? 'REGISTERED' : 'CLEARED'}`)
}

// Keep a failed pairing auth state alive briefly after a code has been issued.
const PAIRING_GRACE_MS = 120000

const SESSIONS_DIR = path.join(__dirname, '..', 'sessions')

if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true })
}

function normalizePhone(phone) {
    return String(phone || '').replace(/\D/g, '')
}

function getSessionPath(phone) {
    return path.join(SESSIONS_DIR, normalizePhone(phone))
}

function createPairingSessionPath(phone) {
    const safePhone = normalizePhone(phone)
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return path.join(SESSIONS_DIR, `.pair-${safePhone}-${token}`)
}

function getStatusCode(lastDisconnect) {
    return lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.data?.statusCode ||
        null
}

function describeDisconnect(lastDisconnect) {
    const err = lastDisconnect?.error
    if (!err) return 'unknown'
    return err?.message || String(err)
}

function isSocketAlive(sock) {
    return !!(
        sock &&
        sock.ws &&
        sock.ws.readyState !== 3
    )
}

async function isRegisteredSession(phone) {
    phone = normalizePhone(phone)
    const sessionPath = getSessionPath(phone)

    if (!fs.existsSync(sessionPath)) return false

    try {
        const { state } = await useMultiFileAuthState(sessionPath)
        return state?.creds?.registered === true
    } catch (err) {
        console.log(`⚠️ AUTH CHECK FAILED ${phone}: ${err.message}`)
        return false
    }
}

// Delete only the canonical unregistered/incomplete auth folder.
async function cleanupIncompleteSession(phone) {
    phone = normalizePhone(phone)

    if (await isRegisteredSession(phone)) {
        return false
    }

    const sessionPath = getSessionPath(phone)

    if (!fs.existsSync(sessionPath)) return false

    fs.rmSync(sessionPath, {
        recursive: true,
        force: true
    })

    console.log(`🧹 INCOMPLETE SESSION REMOVED: ${phone}`)
    return true
}

function cleanupPairingSessionPath(sessionPath, label = '') {
    if (!sessionPath || !fs.existsSync(sessionPath)) return

    try {
        fs.rmSync(sessionPath, {
            recursive: true,
            force: true
        })
        console.log(`🧹 TEMP PAIRING SESSION REMOVED${label ? `: ${label}` : ''}`)
    } catch (err) {
        console.log(`⚠️ TEMP PAIRING CLEANUP FAILED: ${err.message}`)
    }
}

// Copy a newly registered temporary pairing session into the canonical
// session folder. This makes the newly paired device survive a Render restart.
function promotePairingSession(phone, sock) {
    const source = sock?.__sessionPath
    const target = getSessionPath(phone)

    if (!source || !fs.existsSync(source)) {
        throw new Error('PAIRING SESSION DATA NOT FOUND')
    }

    // The old active session is no longer used once the new pairing is open.
    // Its credentials are kept remotely by WhatsApp; only the local bot socket
    // is replaced here.
    if (fs.existsSync(target)) {
        fs.rmSync(target, { recursive: true, force: true })
    }

    fs.cpSync(source, target, {
        recursive: true,
        force: true
    })

    sock.__promoted = true
    sock.__sessionPath = target

    console.log(`🔁 NEW PAIRING SESSION PROMOTED: ${phone}`)
}

// Cache the Baileys version so every /pair request does not wait for a
// separate version lookup.
let cachedVersion = null
let versionPromise = null

async function getBaileysVersion() {
    if (cachedVersion) return cachedVersion

    if (!versionPromise) {
        versionPromise = fetchLatestBaileysVersion()
            .then(result => {
                cachedVersion = result.version
                return cachedVersion
            })
            .finally(() => {
                versionPromise = null
            })
    }

    return versionPromise
}

function waitForPairingReady(sock, timeoutMs = 10000) {
    if (!sock) {
        return Promise.reject(new Error('SOCKET NOT AVAILABLE'))
    }

    if (sock.__pairingReadyPromise) {
        return sock.__pairingReadyPromise
    }

    sock.__pairingReadyPromise = new Promise((resolve, reject) => {
        let finished = false
        let timer

        const finish = (fn, value) => {
            if (finished) return
            finished = true
            clearTimeout(timer)
            try {
                sock.ev.off('connection.update', onUpdate)
            } catch (_) {}
            fn(value)
        }

        const onUpdate = update => {
            const { connection, qr, lastDisconnect } = update || {}

            if (connection === 'connecting' || qr) {
                finish(resolve, true)
                return
            }

            if (connection === 'close') {
                finish(
                    reject,
                    new Error(
                        `WHATSAPP CLOSED BEFORE PAIRING READY (${getStatusCode(lastDisconnect) || 'unknown'}): ${describeDisconnect(lastDisconnect)}`
                    )
                )
            }
        }

        sock.ev.on('connection.update', onUpdate)

        timer = setTimeout(() => {
            finish(reject, new Error('TIMED OUT WAITING FOR WHATSAPP HANDSHAKE'))
        }, timeoutMs)
    })

    return sock.__pairingReadyPromise
}

// ========================================
// CREATE / GET ONE SOCKET
// ========================================
async function createSocket(phone, options = {}) {
    phone = normalizePhone(phone)

    if (!phone) {
        throw new Error('INVALID PHONE NUMBER')
    }

    const pairing = options.pairing === true

    // Normal bot sockets use the canonical phone key.
    // Pairing sockets always use a fresh temporary auth folder so a number
    // that is ALREADY registered can request another valid linking code.
    if (!pairing) {
        const existing = sessions.get(phone)
        if (isSocketAlive(existing)) return existing
    }

    const createKey = pairing ? `pair:${phone}` : phone

    if (creating.has(createKey)) {
        return creating.get(createKey)
    }

    const promise = (async () => {
        const sessionPath = pairing
            ? createPairingSessionPath(phone)
            : getSessionPath(phone)

        fs.mkdirSync(sessionPath, { recursive: true })

        const { state, saveCreds } =
            await useMultiFileAuthState(sessionPath)

        const version = await getBaileysVersion()

        const sock = makeWASocket({
            auth: state,
            version,
            logger: pino({ level: 'silent' }),
            browser: Browsers.ubuntu('Chrome'),
            printQRInTerminal: false,
            syncFullHistory: false,
            markOnlineOnConnect: false,
            keepAliveIntervalMs: 10000,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: undefined
        })

        sock.__phone = phone
        sock.__pairing = pairing
        sock.__pairingCodeIssued = false
        sock.__lastStatusCode = null
        sock.__lastDisconnectMessage = null
        sock.__isConnected = false
        sock.__registeredAtCreation = state?.creds?.registered === true
        sock.__sessionPath = sessionPath
        sock.__pairingAuthPath = pairing ? sessionPath : null
        sock.__promoted = false
        sock.__replaced = false

        // Save credentials to the socket's current auth directory. If a new
        // pairing is promoted, mirror every later credential update into the
        // canonical session too.
        sock.ev.on('creds.update', async () => {
            try {
                await saveCreds()

                if (sock.__pairing && sock.__promoted && sock.__pairingAuthPath) {
                    const target = getSessionPath(phone)
                    fs.cpSync(sock.__pairingAuthPath, target, {
                        recursive: true,
                        force: true
                    })
                }
            } catch (err) {
                console.error(`❌ CREDENTIAL SAVE ERROR ${phone}:`, err.message)
            }
        })

        if (pairing) {
            pairingSockets.set(phone, sock)
        } else {
            sessions.set(phone, sock)
        }

        // Attach the command/message pipeline to EVERY newly created socket.
        if (socketHandler) {
            try {
                socketHandler(sock)
                console.log(`⌨️ MESSAGE HANDLER ATTACHED: ${phone}`)
            } catch (err) {
                console.error(`❌ MESSAGE HANDLER ATTACH FAILED ${phone}:`, err.message)
            }
        }

        sock.ev.on('connection.update', async update => {
            const { connection, lastDisconnect, qr, isOnline } = update || {}

            const statusCode = getStatusCode(lastDisconnect)
            if (statusCode) sock.__lastStatusCode = statusCode
            if (lastDisconnect?.error) {
                sock.__lastDisconnectMessage =
                    lastDisconnect.error?.message || String(lastDisconnect.error)
            }

            if (connection || qr || typeof isOnline !== 'undefined') {
                console.log(
                    `📡 CONNECTION UPDATE ${phone} | connection=${connection || '-'} | online=${typeof isOnline === 'undefined' ? '-' : isOnline} | qr=${qr ? 'YES' : 'NO'} | code=${statusCode || '-'}`
                )
            }

            if (connection === 'open') {
                sock.__isConnected = true

                if (pairing) {
                    try {
                        // The new device has completed registration. Replace the
                        // old local socket with this newly paired device.
                        const oldSock = sessions.get(phone)

                        if (oldSock && oldSock !== sock) {
                            console.log(`🔄 REPLACING OLD LOCAL SOCKET: ${phone}`)
                            oldSock.__replaced = true
                            try { oldSock.end(undefined) } catch (_) {}
                        }

                        promotePairingSession(phone, sock)
                        pairingSockets.delete(phone)
                        sessions.set(phone, sock)

                        console.log(`✅ NEW PAIRING CONNECTED & ACTIVE: ${phone}`)
                    } catch (err) {
                        console.error(`❌ PAIRING PROMOTION FAILED ${phone}:`, err.message)
                    }
                } else {
                    console.log(`✅ WHATSAPP CONNECTED: ${phone}`)
                }
                return
            }

            if (connection === 'connecting') {
                console.log(`🔄 WHATSAPP CONNECTING: ${phone}`)
                return
            }

            if (connection !== 'close') return

            sock.__isConnected = false

            if (sock.__replaced) {
                console.log(`⏹️ OLD SOCKET REPLACED: ${phone}`)
                return
            }

            if (pairingSockets.get(phone) === sock) {
                pairingSockets.delete(phone)
            }

            if (sessions.get(phone) === sock) {
                sessions.delete(phone)
            }

            const registeredNow = state?.creds?.registered === true

            console.log(
                `❌ WHATSAPP DISCONNECTED: ${phone} | code=${statusCode || 'unknown'} | registered=${registeredNow} | pairing=${pairing} | pairingCodeIssued=${sock.__pairingCodeIssued}`
            )

            if (pairing) {
                // A pairing socket has its own temporary auth directory. Never
                // delete the user's existing registered session because of a
                // failed retry.
                if (registeredNow) {
                    // If this pairing socket registered successfully, its auth
                    // was already promoted on connection=open in normal cases.
                    if (sock.__promoted) {
                        // The promoted socket may still be using the temporary
                        // auth directory, so clean that directory only after
                        // this socket has actually closed.
                        cleanupPairingSessionPath(sock.__pairingAuthPath, `${phone} old-pair-auth`)
                        return
                    }
                }

                if (sock.__pairingCodeIssued) {
                    console.log(
                        `⏳ PAIRING GRACE PERIOD: ${phone} | keeping temporary auth for ${PAIRING_GRACE_MS / 1000}s`
                    )

                    setTimeout(() => {
                        if (pairingSockets.get(phone) === sock) return
                        if (sessions.get(phone) === sock) return
                        cleanupPairingSessionPath(sock.__sessionPath, phone)
                    }, PAIRING_GRACE_MS)
                } else {
                    cleanupPairingSessionPath(sock.__sessionPath, phone)
                }

                return
            }

            if (statusCode === DisconnectReason.loggedOut) {
                console.log(`🗑️ LOGGED OUT: ${phone}`)
                try {
                    const sessionPath = getSessionPath(phone)
                    if (fs.existsSync(sessionPath)) {
                        fs.rmSync(sessionPath, { recursive: true, force: true })
                    }
                } catch (err) {
                    console.log(`⚠️ LOGOUT CLEANUP FAILED ${phone}: ${err.message}`)
                }
                return
            }

            // Only authenticated, non-pairing sockets reconnect.
            setTimeout(() => {
                createSocket(phone, { pairing: false }).catch(err => {
                    console.error(`RECONNECT ERROR ${phone}:`, err.message)
                })
            }, 5000)
        })

        return sock
    })()

    creating.set(createKey, promise)

    try {
        return await promise
    } finally {
        creating.delete(createKey)
    }
}

// ========================================
// FRESH PAIRING SOCKET
// ========================================
async function createPairingSocket(phone) {
    phone = normalizePhone(phone)

    if (!phone) {
        throw new Error('INVALID PHONE NUMBER')
    }

    if (pairingRequests.has(phone)) {
        return pairingRequests.get(phone)
    }

    const promise = (async () => {
        // IMPORTANT: Do NOT reject a registered canonical session.
        // A fresh temporary auth state can request another linked-device code.
        const oldPair = pairingSockets.get(phone)
        if (oldPair && isSocketAlive(oldPair)) {
            return oldPair
        }

        const sock = await createSocket(phone, { pairing: true })

        await waitForPairingReady(sock, 15000)
        await new Promise(resolve => setTimeout(resolve, 700))

        if (!isSocketAlive(sock)) {
            const err = new Error('WHATSAPP CONNECTION CLOSED BEFORE PAIRING CODE')
            err.statusCode = sock.__lastStatusCode || null
            throw err
        }

        return sock
    })()

    pairingRequests.set(phone, promise)

    try {
        return await promise
    } finally {
        pairingRequests.delete(phone)
    }
}

// ========================================
// REQUEST ONE PAIRING CODE PER ATTEMPT
// ========================================
async function requestPairingCode(phone) {
    phone = normalizePhone(phone)
    if (!phone) throw new Error('INVALID PHONE NUMBER')

    const sock = await createPairingSocket(phone)

    if (!isSocketAlive(sock)) {
        const err = new Error(
            sock.__lastStatusCode
                ? `WHATSAPP CONNECTION CLOSED (${sock.__lastStatusCode})`
                : 'WHATSAPP SOCKET CLOSED BEFORE PAIRING CODE'
        )
        err.statusCode = sock.__lastStatusCode || null
        throw err
    }

    if (sock.__pairingCodeIssued) {
        // Repeated browser clicks during the SAME pairing attempt should not
        // ask WhatsApp for a second code on the same socket.
        throw new Error('PAIRING ATTEMPT ALREADY IN PROGRESS')
    }

    console.log(`📲 REQUESTING PAIRING CODE: ${phone}`)

    try {
        const code = await sock.requestPairingCode(phone)
        if (!code) throw new Error('PAIRING CODE WAS NOT GENERATED')

        sock.__pairingCodeIssued = true
        console.log(`✅ PAIR CODE GENERATED: ${phone} | ${code}`)

        return { sock, code }
    } catch (err) {
        const statusCode = getStatusCode(err) || sock.__lastStatusCode || null
        err.statusCode = statusCode
        console.error(
            `❌ PAIRING CODE ERROR ${phone}: status=${statusCode || 'unknown'} message=${err?.message || err}`
        )
        throw err
    }
}

// ========================================
// REMOVE SOCKET WITHOUT DELETING SESSION
// ========================================
function removeSocket(phone) {
    phone = normalizePhone(phone)

    const sock = sessions.get(phone)
    if (sock) {
        try { sock.end(undefined) } catch (_) {}
    }

    sessions.delete(phone)
}

// ========================================
// DELETE AUTH SESSION
// ========================================
function cleanupSession(phone) {
    phone = normalizePhone(phone)

    removeSocket(phone)

    const sessionPath = getSessionPath(phone)
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, {
            recursive: true,
            force: true
        })
    }

    console.log(`🗑️ SESSION REMOVED: ${phone}`)
}

module.exports = {
    createSocket,
    createPairingSocket,
    requestPairingCode,
    waitForPairingReady,
    cleanupSession,
    cleanupIncompleteSession,
    isRegisteredSession,
    removeSocket,
    sessions,
    pairingSockets,
    normalizePhone,
    setSocketHandler
}
