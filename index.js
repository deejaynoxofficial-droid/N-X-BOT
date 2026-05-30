require('dotenv').config()

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

const app = express()
const PORT = process.env.PORT || 3000

const SESSION_PATH = './sessions'

// ========================================
// STATIC FILES
// ========================================
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// ========================================
// PAIR ROUTE (FIXED)
// ========================================
app.get('/pair', async (req, res) => {

    try {

        let number = req.query.number

        if (!number) {
            return res.status(400).send('ENTER NUMBER')
        }

        number = number.replace(/[^0-9]/g, '')

        if (number.length < 10) {
            return res.status(400).send('INVALID NUMBER')
        }

        console.log('PAIR REQUEST:', number)

        // DO NOT DELETE SESSION EVERY TIME (FIX)
        if (!fs.existsSync(SESSION_PATH)) {
            fs.mkdirSync(SESSION_PATH, { recursive: true })
        }

        const { state, saveCreds } =
            await useMultiFileAuthState(SESSION_PATH)

        const { version } =
            await fetchLatestBaileysVersion()

        const sock = makeWASocket({

            auth: state,
            version,

            logger: pino({ level: 'silent' }),

            browser: Browsers.windows('Chrome'),

            printQRInTerminal: false,
            markOnlineOnConnect: false
        })

        sock.ev.on('creds.update', saveCreds)

        // ========================================
        // REAL CONNECTION WAIT (FIX)
        // ========================================
        await new Promise((resolve, reject) => {

            const timeout = setTimeout(() => {
                reject(new Error('CONNECTION TIMEOUT'))
            }, 30000)

            sock.ev.on('connection.update', (update) => {

                const { connection } = update

                if (connection === 'open') {
                    clearTimeout(timeout)
                    resolve(true)
                }

                if (connection === 'close') {
                    clearTimeout(timeout)
                    reject(new Error('CONNECTION CLOSED'))
                }
            })
        })

        // ========================================
        // REQUEST CODE
        // ========================================
        const code = await sock.requestPairingCode(number)

        console.log('PAIR CODE:', code)

        return res.json({
            status: true,
            code
        })

    } catch (err) {

        console.error('PAIR ERROR:', err)

        return res.status(500).json({
            status: false,
            message: err.message || 'PAIR FAILED'
        })
    }
})

// ========================================
// START SERVER
// ========================================
app.listen(PORT, () => {
    console.log(`SERVER RUNNING ON ${PORT}`)
})
