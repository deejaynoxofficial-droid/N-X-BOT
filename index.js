require('dotenv').config()

// ========================================
// CORE IMPORTS
// ========================================

const express = require('express')
const fs = require('fs')
const path = require('path')
const pino = require('pino')

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    Browsers
} = require('@whiskeysockets/baileys')

const settings = require('./settings')

const {
    handleCommand
} = require('./handler/commandHandler')

const {
    handleListeners
} = require('./handler/listenerHandler')

const {
    antiDelete
} = require('./handler/antiDelete')

// optional auto view once (safe fallback)
let autoViewOnceHandler = null
try {
    autoViewOnceHandler = require('./handler/autoViewOnce')
} catch {}

// ========================================
// EXPRESS APP
// ========================================

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// ========================================
// SESSION STORAGE (MULTI ACCOUNT)
// ========================================

const SESSIONS_DIR = path.join(__dirname, 'sessions')
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true })
}

// store active sockets per account
const sockets = new Map()

// ========================================
// UTIL: START BOT INSTANCE
// ========================================

async function startBot(sessionId) {

    const sessionPath = path.join(SESSIONS_DIR, sessionId)

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true })
    }

    const { state, saveCreds } =
        await useMultiFileAuthState(sessionPath)

    const { version } =
        await fetchLatestBaileysVersion()

    const sock = makeWASocket({

        version,
        auth: state,

        logger: pino({ level: 'silent' }),

        browser: Browsers.windows('Chrome'),

        printQRInTerminal: false,
        markOnlineOnConnect: true,
        syncFullHistory: false,

        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000
    })

    sockets.set(sessionId, sock)

    // save session
    sock.ev.on('creds.update', saveCreds)

    // ========================================
    // MESSAGE HANDLER
    // ========================================

    sock.ev.on('messages.upsert', async ({ messages }) => {

        const msg = messages?.[0]
        if (!msg || !msg.message) return

        const from = msg.key.remoteJid
        if (from === 'status@broadcast') return

        try {

            //antiDelete
            await antiDelete(sock, { messages: [msg] })
            
            // listeners first
            await handleListeners(sock, msg)

            // auto view once
            if (autoViewOnceHandler && settings.antiViewOnce) {
                await autoViewOnceHandler(sock, msg)
            }

            // commands
            await handleCommand(sock, msg)

        } catch (err) {
            console.log('MESSAGE ERROR:', err)
        }
    })

    // ========================================
    // CONNECTION HANDLER
    // ========================================

    sock.ev.on('connection.update', (update) => {

        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log(`✅ BOT CONNECTED: ${sessionId}`)
        }

        if (connection === 'close') {

            const reason =
                lastDisconnect?.error?.output?.statusCode

            console.log(`❌ DISCONNECTED: ${sessionId}`, reason)

            if (reason !== DisconnectReason.loggedOut) {

                console.log(`♻️ RECONNECTING: ${sessionId}`)

                setTimeout(() => {
                    startBot(sessionId)
                }, 5000)
            }
        }
    })

    return sock
}

// ========================================
// AUTO LOAD MULTI ACCOUNTS
// ========================================

function loadAllSessions() {

    const sessions = fs.readdirSync(SESSIONS_DIR)

    for (const session of sessions) {
        startBot(session)
    }

    console.log(`📦 Loaded ${sessions.length} session(s)`)
}

// ========================================
// PAIR ROUTE (MULTI ACCOUNT)
// ========================================

app.get('/pair', async (req, res) => {

    try {

        let number = req.query.number

        if (!number) {
            return res.status(400).send('ENTER NUMBER')
        }

        number = String(number).replace(/[^0-9]/g, '')

        if (number.startsWith('0')) {
            number = '256' + number.slice(1)
        }

        const sessionId = number
        const sessionPath = path.join(SESSIONS_DIR, sessionId)

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

            browser: Browsers.windows('Chrome'),

            printQRInTerminal: false
        })

        sock.ev.on('creds.update', saveCreds)

        await new Promise(resolve => setTimeout(resolve, 3000))

        const code = await sock.requestPairingCode(number)

        console.log(`📲 PAIR CODE (${number}):`, code)

        return res.json({
            status: true,
            code
        })

    } catch (err) {

        console.log('PAIR ERROR:', err)

        return res.status(500).json({
            status: false,
            message: 'PAIRING FAILED'
        })
    }
})

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🤖 NOX-SPARROW MULTI BOT
┃ 🌐 PORT: ${PORT}
┃ ⚡ SYSTEM ONLINE
╰━━━━━━━━━━━━━━━━━━━━━━⬣
`)

    function loadAllSessions() {

    const sessions = fs.readdirSync(SESSIONS_DIR)

    let loaded = 0

    for (const session of sessions) {

        const sessionPath = path.join(SESSIONS_DIR, session)

        try {

            if (!fs.statSync(sessionPath).isDirectory()) {
                console.log(`⚠️ Skipping invalid session: ${session}`)
                continue
            }

            startBot(session)
            loaded++

        } catch (err) {
            console.log(`⚠️ Failed loading ${session}:`, err.message)
        }
    }

    console.log(`📦 Loaded ${loaded} session(s)`)
    }
