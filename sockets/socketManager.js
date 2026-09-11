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

// One live socket per WhatsApp number.
const sessions = new Map()

// Prevent duplicate socket creation.
const creating = new Map()

// Prevent duplicate /pair requests for the same number.
const pairingRequests = new Map()

// Keep a failed pairing auth state alive briefly after a code has been issued.
// This avoids deleting credentials while WhatsApp is still processing the code.
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

// Delete only an unregistered/incomplete auth folder.
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

// Cache the Baileys version so every /pair request does not wait for a
// separate version lookup. A new lookup is allowed if the first one fails.
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

// Wait only for the beginning of the WebSocket handshake. Do NOT wait for
// connection=open because the account cannot be open until pairing completes.
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
            finish(
                reject,
                new Error('TIMED OUT WAITING FOR WHATSAPP HANDSHAKE')
            )
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

    const existing = sessions.get(phone)
    if (isSocketAlive(existing)) {
        return existing
    }

    if (creating.has(phone)) {
        return creating.get(phone)
    }

    const promise = (async () => {
        const sessionPath = getSessionPath(phone)

        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true })
        }

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
        sock.__isConnected = false
        sock.__registeredAtCreation = state?.creds?.registered === true

        sock.ev.on('creds.update', saveCreds)
        sessions.set(phone, sock)

        sock.ev.on('connection.update', async update => {
            const {
                connection,
                lastDisconnect,
                qr,
                isOnline
            } = update || {}

            const statusCode = getStatusCode(lastDisconnect)

            if (connection || qr || typeof isOnline !== 'undefined') {
                console.log(
                    `📡 CONNECTION UPDATE ${phone} | connection=${connection || '-'} | online=${typeof isOnline === 'undefined' ? '-' : isOnline} | qr=${qr ? 'YES' : 'NO'} | code=${statusCode || '-'}`
                )
            }

            if (connection === 'open') {
                sock.__isConnected = true
                console.log(`✅ WHATSAPP CONNECTED: ${phone}`)
                return
            }

            if (connection === 'connecting') {
                console.log(`🔄 WHATSAPP CONNECTING: ${phone}`)
                return
            }

            if (connection !== 'close') return

            sock.__isConnected = false

            if (sessions.get(phone) === sock) {
                sessions.delete(phone)
            }

            const registeredNow = state?.creds?.registered === true

            console.log(
                `❌ WHATSAPP DISCONNECTED: ${phone} | code=${statusCode || 'unknown'} | registered=${registeredNow} | pairingCodeIssued=${sock.__pairingCodeIssued}`
            )

            // A code may already have been delivered to the user. Never delete
            // the auth folder immediately in that situation; WhatsApp may still
            // be finishing the companion registration.
            if (sock.__pairing && !registeredNow) {
                if (sock.__pairingCodeIssued) {
                    console.log(
                        `⏳ PAIRING GRACE PERIOD: ${phone} | keeping auth state for ${PAIRING_GRACE_MS / 1000}s`
                    )

                    setTimeout(async () => {
                        // If another socket has since connected/registered,
                        // leave the session alone.
                        if (await isRegisteredSession(phone)) return
                        if (sessions.has(phone)) return

                        try {
                            await cleanupIncompleteSession(phone)
                        } catch (err) {
                            console.log(
                                `⚠️ PAIRING GRACE CLEANUP FAILED ${phone}: ${err.message}`
                            )
                        }
                    }, PAIRING_GRACE_MS)
                } else {
                    // No code was ever delivered, so this attempt can be
                    // safely discarded immediately.
                    try {
                        await cleanupIncompleteSession(phone)
                    } catch (err) {
                        console.log(
                            `⚠️ INCOMPLETE SESSION CLEANUP FAILED ${phone}: ${err.message}`
                        )
                    }
                }

                return
            }

            if (statusCode === DisconnectReason.loggedOut) {
                console.log(`🗑️ LOGGED OUT: ${phone}`)
                try {
                    const sessionPath = getSessionPath(phone)
                    if (fs.existsSync(sessionPath)) {
                        fs.rmSync(sessionPath, {
                            recursive: true,
                            force: true
                        })
                    }
                } catch (err) {
                    console.log(
                        `⚠️ LOGOUT CLEANUP FAILED ${phone}: ${err.message}`
                    )
                }
                return
            }

            // Only authenticated, non-pairing sockets reconnect.
            setTimeout(() => {
                createSocket(phone, { pairing: false }).catch(err => {
                    console.error(
                        `RECONNECT ERROR ${phone}:`,
                        err.message
                    )
                })
            }, 5000)
        })

        return sock
    })()

    creating.set(phone, promise)

    try {
        return await promise
    } finally {
        creating.delete(phone)
    }
}

// ========================================
// SAFE PAIRING SOCKET
// ========================================
async function createPairingSocket(phone) {
    phone = normalizePhone(phone)

    if (!phone) {
        throw new Error('INVALID PHONE NUMBER')
    }

    // Never replace an already registered account.
    if (await isRegisteredSession(phone)) {
        throw new Error('THIS NUMBER ALREADY HAS A REGISTERED SESSION')
    }

    // If two browser requests arrive together, share the same pairing flow.
    if (pairingRequests.has(phone)) {
        return pairingRequests.get(phone)
    }

    const promise = (async () => {
        const existing = sessions.get(phone)
        if (existing && isSocketAlive(existing)) {
            // Reuse an active pairing socket rather than creating a second one.
            return existing
        }

        if (existing) {
            sessions.delete(phone)
        }

        // A fresh pairing starts from a clean, unregistered auth directory.
        await cleanupIncompleteSession(phone)

        const sock = await createSocket(phone, { pairing: true })
        await waitForPairingReady(sock)

        if (!isSocketAlive(sock)) {
            throw new Error('WHATSAPP SOCKET CLOSED DURING PAIRING STARTUP')
        }

        return sock
    })()

    pairingRequests.set(phone, promise)

    try {
        return await promise
    } finally {
        // Do not keep the lock after the socket has been prepared. The socket
        // itself remains in sessions and is reused by the next status request.
        pairingRequests.delete(phone)
    }
}

// ========================================
// REQUEST ONE PAIRING CODE
// ========================================
async function requestPairingCode(phone) {
    phone = normalizePhone(phone)

    if (!phone) {
        throw new Error('INVALID PHONE NUMBER')
    }

    const sock = await createPairingSocket(phone)

    if (!isSocketAlive(sock)) {
        throw new Error('WHATSAPP SOCKET CLOSED BEFORE PAIRING CODE')
    }

    // Never ask Baileys for multiple codes during one pairing attempt.
    if (sock.__pairingCodeIssued) {
        throw new Error('PAIRING CODE ALREADY ISSUED FOR THIS NUMBER')
    }

    console.log(`📲 REQUESTING PAIRING CODE: ${phone}`)

    const code = await sock.requestPairingCode(phone)

    if (!code) {
        throw new Error('PAIRING CODE WAS NOT GENERATED')
    }

    sock.__pairingCodeIssued = true

    console.log(`✅ PAIR CODE GENERATED: ${phone}`)

    return {
        sock,
        code
    }
}

// ========================================
// REMOVE SOCKET WITHOUT DELETING SESSION
// ========================================
function removeSocket(phone) {
    phone = normalizePhone(phone)

    const sock = sessions.get(phone)

    if (sock) {
        try {
            sock.end(undefined)
        } catch (_) {}
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
    normalizePhone
}
