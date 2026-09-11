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

const sessions = new Map()
const creating = new Map()
const pairing = new Map()

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

function waitForPairingReady(sock, timeout = 15000) {
    return new Promise((resolve, reject) => {
        let finished = false

        const finish = (fn, value) => {
            if (finished) return
            finished = true
            clearTimeout(timer)

            try {
                sock.ev.off('connection.update', listener)
            } catch (_) {}

            fn(value)
        }

        const listener = (update) => {
            const { connection, qr } = update || {}

            if (connection === 'connecting' || qr) {
                finish(resolve, true)
                return
            }

            if (connection === 'open') {
                finish(resolve, true)
                return
            }

            if (connection === 'close') {
                finish(
                    reject,
                    new Error(
                        'WhatsApp connection closed before pairing code was generated'
                    )
                )
            }
        }

        const timer = setTimeout(() => {
            finish(
                reject,
                new Error('Timed out waiting for WhatsApp connection')
            )
        }, timeout)

        sock.ev.on('connection.update', listener)

        if (sock.ws && sock.ws.readyState === 1) {
            finish(resolve, true)
        }
    })
}

async function createSocket(phone, onSocketCreated = null) {
    phone = normalizePhone(phone)

    if (!phone) {
        throw new Error('INVALID PHONE NUMBER')
    }

    const existing = sessions.get(phone)

    if (existing && existing.ws && existing.ws.readyState !== 3) {
        if (typeof onSocketCreated === 'function') {
            onSocketCreated(existing)
        }
        return existing
    }

    if (creating.has(phone)) {
        const sock = await creating.get(phone)

        if (typeof onSocketCreated === 'function') {
            onSocketCreated(sock)
        }

        return sock
    }

    const promise = (async () => {
        const sessionPath = getSessionPath(phone)

        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true })
        }

        const { state, saveCreds } =
            await useMultiFileAuthState(sessionPath)

        const { version } = await fetchLatestBaileysVersion()

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
            defaultQueryTimeoutMs: 60000
        })

        sock.ev.on('creds.update', saveCreds)

        sessions.set(phone, sock)

        if (typeof onSocketCreated === 'function') {
            try {
                onSocketCreated(sock)
            } catch (err) {
                console.error(
                    `SOCKET HANDLER ERROR ${phone}:`,
                    err.message
                )
            }
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update || {}

            const statusCode =
                lastDisconnect?.error?.output?.statusCode

            if (connection === 'connecting') {
                console.log(`🔄 WHATSAPP CONNECTING: ${phone}`)
            }

            if (connection === 'open') {
                console.log(`✅ WHATSAPP CONNECTED: ${phone}`)
                pairing.delete(phone)
                return
            }

            if (connection === 'close') {
                if (sessions.get(phone) === sock) {
                    sessions.delete(phone)
                }

                console.log(
                    `❌ WHATSAPP DISCONNECTED: ${phone} | code: ${statusCode || 'unknown'}`
                )

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log(`🗑️ LOGGED OUT: ${phone}`)
                    pairing.delete(phone)
                    return
                }

                if (pairing.has(phone)) {
                    console.log(`⚠️ PAIRING SOCKET CLOSED: ${phone}`)
                    pairing.delete(phone)
                }

                if (state.creds.registered) {
                    setTimeout(() => {
                        createSocket(
                            phone,
                            onSocketCreated
                        ).catch((err) => {
                            console.error(
                                `RECONNECT ERROR ${phone}:`,
                                err.message
                            )
                        })
                    }, 5000)
                }
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

async function createPairingSocket(
    phone,
    onSocketCreated = null
) {
    phone = normalizePhone(phone)

    if (!phone) {
        throw new Error('INVALID PHONE NUMBER')
    }

    if (pairing.has(phone)) {
        throw new Error(
            'PAIRING ALREADY IN PROGRESS FOR THIS NUMBER'
        )
    }

    const sessionPath = getSessionPath(phone)

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true })
    }

    const { state } = await useMultiFileAuthState(sessionPath)

    if (state.creds.registered) {
        throw new Error('THIS NUMBER IS ALREADY PAIRED')
    }

    pairing.set(phone, true)

    try {
        const sock = await createSocket(
            phone,
            onSocketCreated
        )

        await waitForPairingReady(sock, 15000)

        console.log(
            `📲 REQUESTING PAIRING CODE: ${phone}`
        )

        const code = await sock.requestPairingCode(phone)

        console.log(
            `✅ PAIR CODE GENERATED: ${phone} | ${code}`
        )

        return {
            sock,
            code
        }
    } catch (err) {
        pairing.delete(phone)

        console.error(
            `❌ PAIRING ERROR ${phone}:`,
            err.message
        )

        throw err
    }
}

function removeSocket(phone) {
    phone = normalizePhone(phone)

    const sock = sessions.get(phone)

    if (sock) {
        try {
            sock.end(undefined)
        } catch (_) {}
    }

    sessions.delete(phone)
    pairing.delete(phone)
}

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
    cleanupSession,
    removeSocket,
    sessions,
    normalizePhone
}
