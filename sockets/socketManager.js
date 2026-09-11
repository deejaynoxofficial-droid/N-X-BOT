const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
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

// ========================================
// CREATE / GET ONE SOCKET
// ========================================

async function createSocket(phone) {
    phone = normalizePhone(phone)

    if (!phone) {
        throw new Error('INVALID PHONE NUMBER')
    }

    // Reuse a live socket for this number
    const existing = sessions.get(phone)

    if (existing && existing.ws && existing.ws.readyState !== 3) {
        return existing
    }

    // If another request is already creating this socket, wait for it
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

            browser: [
                'Ubuntu',
                'Chrome',
                '20.0.04'
            ],

            printQRInTerminal: false,
            syncFullHistory: false,
            markOnlineOnConnect: false,

            keepAliveIntervalMs: 10000,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000
        })

        // IMPORTANT: save credentials immediately whenever Baileys changes them
        sock.ev.on('creds.update', saveCreds)

        sessions.set(phone, sock)

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update

            const statusCode =
                lastDisconnect?.error?.output?.statusCode

            if (connection === 'open') {
                console.log(`✅ WHATSAPP CONNECTED: ${phone}`)
                return
            }

            if (connection === 'close') {
                // Only remove this exact socket from the map.
                // This prevents an old socket from deleting a newer socket.
                if (sessions.get(phone) === sock) {
                    sessions.delete(phone)
                }

                console.log(
                    `❌ WHATSAPP DISCONNECTED: ${phone} | code: ${statusCode || 'unknown'}`
                )

                // Logged out means the authentication is no longer valid.
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log(`🗑️ LOGGED OUT: ${phone}`)
                    return
                }

                // Reconnect transient failures.
                setTimeout(() => {
                    createSocket(phone).catch((err) => {
                        console.error(
                            `RECONNECT ERROR ${phone}:`,
                            err.message
                        )
                    })
                }, 5000)
            }
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
    cleanupSession,
    removeSocket,
    sessions,
    normalizePhone
}
