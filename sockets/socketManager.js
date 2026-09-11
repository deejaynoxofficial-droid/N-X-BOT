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

// One socket per WhatsApp number
const sessions = new Map()

// Prevent two sockets from being created at the same time
const creating = new Map()

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

// Check whether an auth directory contains a fully registered account.
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

// Only remove an incomplete/unregistered auth directory.
// A valid logged-in session is NEVER deleted by this function.
async function cleanupIncompleteSession(phone) {
    phone = normalizePhone(phone)

    if (await isRegisteredSession(phone)) {
        return false
    }

    const sessionPath = getSessionPath(phone)

    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, {
            recursive: true,
            force: true
        })
        console.log(`🧹 INCOMPLETE SESSION REMOVED: ${phone}`)
        return true
    }

    return false
}

// Wait until Baileys has started its connection handshake.
// Pairing codes should not be requested immediately after makeWASocket().
function waitForPairingReady(sock, timeoutMs = 15000) {
    if (!sock) {
        return Promise.reject(new Error('SOCKET NOT AVAILABLE'))
    }

    if (sock.__pairingReady) {
        return sock.__pairingReady
    }

    sock.__pairingReady = new Promise((resolve, reject) => {
        let finished = false
        let timer = null

        const finish = (fn, value) => {
            if (finished) return
            finished = true
            if (timer) clearTimeout(timer)
            try {
                sock.ev.off('connection.update', onUpdate)
            } catch (_) {}
            fn(value)
        }

        const onUpdate = (update) => {
            const { connection, qr, lastDisconnect } = update || {}

            if (connection === 'connecting' || qr) {
                finish(resolve, true)
                return
            }

            if (connection === 'close') {
                finish(
                    reject,
                    new Error(
                        `WHATSAPP CLOSED BEFORE PAIRING WAS READY (${getStatusCode(lastDisconnect) || 'unknown'}): ${describeDisconnect(lastDisconnect)}`
                    )
                )
            }
        }

        sock.ev.on('connection.update', onUpdate)

        timer = setTimeout(() => {
            finish(
                reject,
                new Error('TIMED OUT WAITING FOR WHATSAPP CONNECTION TO START')
            )
        }, timeoutMs)
    })

    return sock.__pairingReady
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

    // Reuse a live socket for this number.
    const existing = sessions.get(phone)
    if (existing && existing.ws && existing.ws.readyState !== 3) {
        return existing
    }

    // If another request is already creating this socket, wait for it.
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

        const { version } =
            await fetchLatestBaileysVersion()

        const sock = makeWASocket({
            auth: state,
            version,
            logger: pino({ level: 'silent' }),

            // Canonical Baileys browser identifier.
            browser: Browsers.ubuntu('Chrome'),

            printQRInTerminal: false,
            syncFullHistory: false,
            markOnlineOnConnect: false,

            keepAliveIntervalMs: 10000,
            connectTimeoutMs: 60000,

            // Leaving this undefined avoids an overly aggressive query timeout
            // during the pairing handshake on some Baileys 6.x deployments.
            defaultQueryTimeoutMs: undefined
        })

        // Save credentials whenever Baileys changes them.
        sock.ev.on('creds.update', saveCreds)

        // Metadata used by reconnect/cleanup logic.
        sock.__phone = phone
        sock.__pairing = pairing
        sock.__registeredAtCreation = state?.creds?.registered === true

        sessions.set(phone, sock)

        sock.ev.on('connection.update', async (update) => {
            const {
                connection,
                lastDisconnect,
                qr,
                isOnline
            } = update || {}

            const statusCode = getStatusCode(lastDisconnect)

            if (connection || qr || typeof isOnline !== 'undefined') {
                console.log(
                    `📡 CONNECTION UPDATE ${phone} | connection=${connection || '-'} | online=${typeof isOnline === 'undefined' ? '-' : isOnline} | qr=${qr ? 'YES' : 'NO'} | code=${statusCode || '-'}${lastDisconnect ? ` | error=${describeDisconnect(lastDisconnect)}` : ''}`
                )
            }

            if (connection === 'open') {
                console.log(`✅ WHATSAPP CONNECTED: ${phone}`)
                sock.__isConnected = true
                return
            }

            if (connection === 'connecting') {
                console.log(`🔄 WHATSAPP CONNECTING: ${phone}`)
                return
            }

            if (connection !== 'close') return

            sock.__isConnected = false

            // Remove only this exact socket from the map.
            if (sessions.get(phone) === sock) {
                sessions.delete(phone)
            }

            console.log(
                `❌ WHATSAPP DISCONNECTED: ${phone} | code: ${statusCode || 'unknown'} | ${describeDisconnect(lastDisconnect)}`
            )

            // A pairing socket that never became registered must NOT be
            // automatically recreated. Recreating it can loop into 401/428.
            const registeredNow =
                state?.creds?.registered === true

            if (!registeredNow) {
                console.log(
                    `🛑 PAIRING SOCKET STOPPED: ${phone} | account is not registered`
                )

                // Remove only incomplete auth state. Never touch a valid session.
                try {
                    await cleanupIncompleteSession(phone)
                } catch (err) {
                    console.log(
                        `⚠️ INCOMPLETE SESSION CLEANUP FAILED ${phone}: ${err.message}`
                    )
                }

                return
            }

            // Valid authenticated sessions can reconnect after transient errors.
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

            setTimeout(() => {
                createSocket(phone, { pairing: false }).catch((err) => {
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
// CREATE FRESH SOCKET FOR PAIRING
// ========================================
async function createPairingSocket(phone) {
    phone = normalizePhone(phone)

    if (!phone) {
        throw new Error('INVALID PHONE NUMBER')
    }

    // Do not destroy an already authenticated account.
    if (await isRegisteredSession(phone)) {
        const existing = sessions.get(phone)
        if (existing && existing.ws && existing.ws.readyState !== 3) {
            throw new Error('THIS NUMBER IS ALREADY CONNECTED')
        }
        throw new Error('THIS NUMBER ALREADY HAS A REGISTERED SESSION')
    }

    // Remove stale/partial creds left by an earlier failed pairing attempt.
    if (sessions.has(phone)) {
        removeSocket(phone)
    }

    await cleanupIncompleteSession(phone)

    const sock = await createSocket(phone, { pairing: true })

    await waitForPairingReady(sock)

    return sock
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
    waitForPairingReady,
    cleanupSession,
    cleanupIncompleteSession,
    isRegisteredSession,
    removeSocket,
    sessions,
    normalizePhone
}
