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
    DisconnectReason
} = require('@whiskeysockets/baileys')

// ========================================
// APP
// ========================================

const app = express()

const PORT =
    process.env.PORT || 3000

const SESSION_PATH =
    './sessions'

// ========================================
// STATIC FILES
// ========================================

app.use(
    express.static(
        path.join(
            __dirname,
            'public'
        )
    )
)

// ========================================
// HOME PAGE
// ========================================

app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'public',
            'index.html'
        )
    )
})

// ========================================
// PAIR ROUTE
// ========================================
app.get('/pair', async (req, res) => {

    let replied = false

    try {

        let number = req.query.number

        if (!number) {
            return res.status(400).send('ENTER NUMBER')
        }

        number = String(number)
            .replace(/[^0-9]/g, '')

        if (number.startsWith('0')) {
            number = '256' + number.slice(1)
        }

        if (number.length < 11 || number.length > 15) {
            return res.status(400).send('INVALID NUMBER')
        }

        console.log('PAIR REQUEST:', number)

        if (fs.existsSync(SESSION_PATH)) {
            fs.rmSync(SESSION_PATH, {
                recursive: true,
                force: true
            })
        }

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(
            SESSION_PATH
        )

        const {
            version
        } = await fetchLatestBaileysVersion()

        const sock = makeWASocket({

            auth: state,

            version,

            logger: pino({
                level: 'silent'
            }),

            browser: [
                'NOX-SPARROW',
                'Chrome',
                '1.0.0'
            ]
        })

        sock.ev.on(
            'creds.update',
            saveCreds
        )

        const timeout = setTimeout(() => {

            if (!replied) {

                replied = true

                res.status(408).send(
                    'PAIR REQUEST TIMEOUT'
                )
            }

        }, 30000)

        try {

            const code =
                await sock.requestPairingCode(
                    number
                )

            clearTimeout(timeout)

            console.log(
                'PAIR CODE:',
                code
            )

            if (!replied) {

                replied = true

                return res.send(code)
            }

        } catch (err) {

            clearTimeout(timeout)

            console.error(
                'PAIR CODE ERROR:',
                err
            )

            if (!replied) {

                replied = true

                return res.status(500).send(
                    err?.message ||
                    'PAIRING FAILED'
                )
            }
        }

    } catch (err) {

        console.error(
            'PAIR ROUTE ERROR:',
            err
        )

        if (!replied) {

            replied = true

            return res.status(500).send(
                err?.message ||
                'SERVER ERROR'
            )
        }
    }
})

                
// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━⬣
┃
┃ 🤖 NOX-SPARROW ONLINE
┃ 🌐 PORT: ${PORT}
┃ 🚀 SERVER RUNNING
┃
╰━━━━━━━━━━━━━━━━━━━━━━⬣
`)
})
