require('dotenv').config()

const express = require('express')
const fs = require('fs')
const path = require('path')

const {
    createSocket,
    normalizePhone,
    sessions
} = require('./sockets/socketManager')

const {
    handleCommand
} = require('./handler/commandHandler')

// ========================================
// OPTIONAL HANDLERS
// ========================================

let handleListeners = null
let antiDelete = null
let autoViewOnceHandler = null

try {
    const listener = require('./handler/listenerHandler')
    handleListeners = listener.handleListeners || null
} catch (err) {
    console.log('⚠️ listenerHandler not loaded')
}

try {
    const anti = require('./handler/antiDelete')
    antiDelete = anti.antiDelete || null
} catch (err) {
    console.log('⚠️ antiDelete not loaded')
}

try {
    autoViewOnceHandler =
        require('./handler/autoViewOnce')
} catch (err) {
    // Optional feature
}

// ========================================
// SETTINGS
// ========================================

let settings = {}

try {
    settings = require('./settings')
} catch (err) {
    console.log('⚠️ settings.js not loaded')
}

// ========================================
// EXPRESS
// ========================================

const app = express()

const PORT =
    Number(process.env.PORT) || 3000

const PUBLIC_PATH =
    path.join(__dirname, 'public')

const SESSIONS_PATH =
    path.join(__dirname, 'sessions')

// ========================================
// CREATE REQUIRED DIRECTORIES
// ========================================

for (const folder of [
    SESSIONS_PATH,
    path.join(__dirname, 'temp'),
    path.join(__dirname, 'logs'),
    path.join(__dirname, 'database')
]) {
    try {
        fs.mkdirSync(folder, {
            recursive: true
        })
    } catch (err) {
        console.error(
            'FOLDER ERROR:',
            folder,
            err.message
        )
    }
}

// ========================================
// EXPRESS MIDDLEWARE
// ========================================

app.use(express.json({
    limit: '1mb'
}))

app.use(express.urlencoded({
    extended: true
}))

app.use(
    express.static(PUBLIC_PATH)
)

// ========================================
// HOME
// ========================================

app.get('/', (req, res) => {

    const indexFile =
        path.join(
            PUBLIC_PATH,
            'index.html'
        )

    if (!fs.existsSync(indexFile)) {
        return res.status(404).send(
            'NOX-SPARROW WEBSITE NOT FOUND'
        )
    }

    res.sendFile(indexFile)
})

// ========================================
// HEALTH
// ========================================

app.get('/health', (req, res) => {

    res.status(200).json({
        status: 'ok',
        bot: 'NOX-SPARROW',
        uptime: process.uptime(),
        activeSessions: sessions.size
    })
})

// ========================================
// ATTACH MESSAGE HANDLERS
// ========================================

const attachedSockets =
    new WeakSet()

function attachMessageHandlers(sock) {

    if (!sock) return

    // Prevent duplicate listeners
    if (attachedSockets.has(sock)) {
        return
    }

    attachedSockets.add(sock)

    sock.ev.on(
        'messages.upsert',
        async (update) => {

            try {

                const messages =
                    update?.messages || []

                for (const msg of messages) {

                    if (!msg?.message) {
                        continue
                    }

                    const remoteJid =
                        msg.key?.remoteJid

                    if (!remoteJid) {
                        continue
                    }

                    if (
                        remoteJid ===
                        'status@broadcast'
                    ) {
                        continue
                    }

                    // ========================================
                    // ANTI DELETE
                    // ========================================

                    if (
                        typeof antiDelete ===
                        'function'
                    ) {

                        try {

                            await antiDelete(
                                sock,
                                {
                                    messages: [msg]
                                }
                            )

                        } catch (err) {

                            console.log(
                                'ANTI-DELETE ERROR:',
                                err.message
                            )
                        }
                    }

                    // ========================================
                    // LISTENERS
                    // ========================================

                    if (
                        typeof handleListeners ===
                        'function'
                    ) {

                        try {

                            await handleListeners(
                                sock,
                                msg
                            )

                        } catch (err) {

                            console.log(
                                'LISTENER ERROR:',
                                err.message
                            )
                        }
                    }

                    // ========================================
                    // VIEW ONCE
                    // ========================================

                    if (
                        autoViewOnceHandler &&
                        settings.antiViewOnce
                    ) {

                        try {

                            await autoViewOnceHandler(
                                sock,
                                msg
                            )

                        } catch (err) {

                            console.log(
                                'VIEW ONCE ERROR:',
                                err.message
                            )
                        }
                    }

                    // ========================================
                    // COMMAND HANDLER
                    // ========================================

                    try {

                        await handleCommand(
                            sock,
                            msg
                        )

                    } catch (err) {

                        console.error(
                            'COMMAND HANDLER ERROR:',
                            err
                        )
                    }
                }

            } catch (err) {

                console.error(
                    'MESSAGE EVENT ERROR:',
                    err
                )
            }
        }
    )
}

// ========================================
// CREATE / PREPARE BOT
// ========================================

async function prepareBot(phone) {

    phone =
        normalizePhone(phone)

    if (!phone) {
        throw new Error(
            'INVALID PHONE NUMBER'
        )
    }

    console.log(
        `🔌 Preparing NOX-SPARROW: ${phone}`
    )

    const sock =
        await createSocket(phone)

    // VERY IMPORTANT:
    // Attach command handling to the socket.
    attachMessageHandlers(sock)

    return sock
}

// ========================================
// PAIR ROUTE
// ========================================

app.get('/pair', async (req, res) => {

    let phone =
        normalizePhone(
            req.query.number
        )

    if (!phone) {

        return res.status(400).json({
            status: false,
            message: 'Phone number is required'
        })
    }

    // Uganda convenience:
    // 0700xxxxxx -> 256700xxxxxx

    if (
        phone.startsWith('0') &&
        phone.length === 10
    ) {
        phone =
            '256' +
            phone.slice(1)
    }

    // Basic validation
    if (
        phone.length < 10 ||
        phone.length > 15
    ) {

        return res.status(400).json({
            status: false,
            message: 'Invalid phone number'
        })
    }

    try {

        console.log(
            `📲 PAIR REQUEST: ${phone}`
        )

        const sock =
            await prepareBot(phone)

        /*
         * IMPORTANT:
         *
         * Do NOT wait for connection === "open"
         * here.
         *
         * The account is not paired yet.
         * Request the pairing code while the
         * socket is still establishing connection.
         */

        const code =
            await sock.requestPairingCode(
                phone
            )

        console.log(
            `✅ PAIR CODE GENERATED: ${phone}`
        )

        return res.json({
            status: true,
            number: phone,
            code: code
        })

    } catch (err) {

        console.error(
            `❌ PAIR ERROR ${phone}:`,
            err
        )

        return res.status(500).json({
            status: false,
            message:
                err?.message ||
                'Pairing failed'
        })
    }
})

// ========================================
// SESSION STATUS
// ========================================

app.get('/status', (req, res) => {

    const phone =
        normalizePhone(
            req.query.number
        )

    if (!phone) {

        return res.status(400).json({
            status: false,
            message: 'Phone number required'
        })
    }

    const sock =
        sessions.get(phone)

    const connected =
        !!(
            sock &&
            sock.ws &&
            sock.ws.readyState === 1
        )

    return res.json({
        status: true,
        number: phone,
        connected
    })
})

// ========================================
// GLOBAL ERROR PROTECTION
// ========================================

process.on(
    'uncaughtException',
    (err) => {

        console.error(
            'UNCAUGHT EXCEPTION:',
            err
        )
    }
)

process.on(
    'unhandledRejection',
    (reason) => {

        console.error(
            'UNHANDLED REJECTION:',
            reason
        )
    }
)

// ========================================
// START SERVER
// ========================================

app.listen(
    PORT,
    '0.0.0.0',
    () => {

        console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🤖 NOX-SPARROW BOT
┃ 🌐 PORT: ${PORT}
┃ 🔐 MULTI-USER: ENABLED
┃ ⚡ COMMAND SYSTEM: ENABLED
┃ 📲 PAIRING: ENABLED
┃ 🚀 SERVER ONLINE
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣
        `)
    }
)
