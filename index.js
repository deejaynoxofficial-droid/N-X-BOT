require('dotenv').config()

// ========================================
// IMPORTS
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

// ========================================
// APP INIT
// ========================================

const app = express()
const PORT = process.env.PORT || 3000

const SESSION_PATH = './sessions'

// ========================================
// STATIC FRONTEND
// ========================================

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// ========================================
// PAIR FUNCTION
// ========================================

app.get('/pair', async (req, res) => {

    let replied = false

    try {

        let number = req.query.number

        if (!number) {
            return res.status(400).send('ENTER NUMBER')
        }

        number = String(number).replace(/[^0-9]/g, '')

        if (number.startsWith('0')) {
            number = '256' + number.slice(1)
        }

        if (number.length < 11) {
            return res.status(400).send('INVALID NUMBER')
        }

        console.log('PAIR REQUEST:', number)

        // DO NOT delete session every time (causes timeout)
        if (!fs.existsSync(SESSION_PATH)) {
            fs.mkdirSync(SESSION_PATH, { recursive: true })
        }

        const { state, saveCreds } =
            await useMultiFileAuthState(SESSION_PATH)

        const { version } =
            await fetchLatestBaileysVersion()

        const sock = makeWASocket({

            version,

            auth: state,

            logger: pino({ level: 'silent' }),

            browser: Browsers.windows('Chrome'),

            markOnlineOnConnect: false
        })

        sock.ev.on('creds.update', saveCreds)

        // ========================================
        // WAIT CONNECTION PROPERLY
        // ========================================

        await new Promise((resolve, reject) => {

            const timeout = setTimeout(() => {
                reject(new Error('CONNECTION TIMEOUT'))
            }, 30000)

            sock.ev.on('connection.update', (update) => {

                const { connection } = update

                if (connection === 'open') {
                    clearTimeout(timeout)
                    resolve()
                }
            })
        })

        // ========================================
        // REQUEST CODE
        // ========================================

        const code = await sock.requestPairingCode(number)

        console.log('PAIR CODE:', code)

        replied = true
        return res.send(code)

    } catch (err) {

        console.error('PAIR ERROR:', err)

        if (!replied) {
            return res.status(500).send('PAIRING FAILED')
        }
    }
})

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🤖 BOT SERVER ONLINE
┃ 🌐 PORT: ${PORT}
┃ 🚀 READY
╰━━━━━━━━━━━━━━━━━━━━━━⬣
`)
})
