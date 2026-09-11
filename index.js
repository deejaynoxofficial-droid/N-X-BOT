require('dotenv').config()

// ========================================
// IMPORTS
// ========================================

const express = require('express')
const fs = require('fs')
const path = require('path')

const {
    createSocket,
    sessions,
    normalizePhone
} = require('./sockets/socketManager')

// ========================================
// APP
// ========================================

const app = express()
const PORT = Number(process.env.PORT) || 3000

const SESSION_PATH = path.join(__dirname, 'sessions')

if (!fs.existsSync(SESSION_PATH)) {
    fs.mkdirSync(SESSION_PATH, { recursive: true })
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

// ========================================
// FRONTEND
// ========================================

app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'index.html')
    )
})

// ========================================
// HEALTH
// ========================================

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        activeSockets: sessions.size
    })
})

// ========================================
// PAIRING ROUTE
// ========================================

app.get('/pair', async (req, res) => {
    try {
        let number =
            req.query.number ||
            req.query.phone

        if (!number) {
            return res.status(400).json({
                status: false,
                error: 'Please enter a phone number.'
            })
        }

        number = normalizePhone(number)

        // Uganda convenience: 07xxxxxxxx -> 2567xxxxxxxx
        if (number.startsWith('0')) {
            number = '256' + number.slice(1)
        }

        // Basic validation.
        // International numbers should normally contain at least 10 digits.
        if (number.length < 10 || number.length > 15) {
            return res.status(400).json({
                status: false,
                error: 'Invalid phone number.'
            })
        }

        console.log(`📲 PAIR REQUEST: ${number}`)

        // ONE socket only. The pairing route does not create
        // its own separate Baileys socket.
        const sock = await createSocket(number)

        // If the account is already authenticated, do not generate
        // another pairing code.
        if (sock.authState?.creds?.registered) {
            return res.status(409).json({
                status: false,
                error: 'This number is already paired.',
                number
            })
        }

        /*
         * IMPORTANT:
         * Do NOT wait for connection === "open" here.
         *
         * "open" happens AFTER the WhatsApp account has been
         * authenticated. We need the pairing code BEFORE that.
         */
        await new Promise(resolve => setTimeout(resolve, 2500))

        const rawCode =
            await sock.requestPairingCode(number)

        const code =
            String(rawCode || '')
                .replace(/[^A-Z0-9]/gi, '')
                .match(/.{1,4}/g)
                ?.join('-') || rawCode

        console.log(
            `🔐 PAIRING CODE FOR ${number}: ${code}`
        )

        return res.status(200).json({
            status: true,
            code,
            pairingCode: code,
            number,
            message: 'Enter this code in WhatsApp Linked Devices.'
        })

    } catch (error) {
        console.error(
            '❌ PAIRING ERROR:',
            error
        )

        return res.status(500).json({
            status: false,
            error: 'Failed to generate pairing code.',
            message: error?.message || 'Unknown server error'
        })
    }
})

// ========================================
// START SERVER
// ========================================

const server = app.listen(
    PORT,
    '0.0.0.0',
    () => {
        console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🤖 NOX-SPARROW BOT
┃ 🌐 PORT: ${PORT}
┃ 🔐 PAIRING: READY
┃ 👥 MULTI-USER: ENABLED
┃ 🚀 SERVER ONLINE
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣
`)
    }
)

// ========================================
// SAFE PROCESS HANDLING
// ========================================

process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason)
})

process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error)
})

// Graceful shutdown
function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down...`)

    for (const [phone, sock] of sessions) {
        try {
            sock.end(undefined)
        } catch (_) {}

        console.log(`🔌 Socket closed: ${phone}`)
    }

    server.close(() => {
        process.exit(0)
    })

    setTimeout(() => {
        process.exit(0)
    }, 5000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
