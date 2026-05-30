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

    try {

        let number =
            req.query.number

        if (!number) {

            return res.send(
                'ENTER NUMBER'
            )
        }

        number =
            number.replace(
                /[^0-9]/g,
                ''
            )

        if (
            number.startsWith('0')
        ) {

            number =
                '256' +
                number.slice(1)
        }

        if (
            number.length < 11
        ) {

            return res.send(
                'INVALID NUMBER'
            )
        }

        console.log(
            'PAIR REQUEST:',
            number
        )

        if (
            fs.existsSync(
                SESSION_PATH
            )
        ) {

            fs.rmSync(
                SESSION_PATH,
                {
                    recursive: true,
                    force: true
                }
            )
        }

        const {
            state,
            saveCreds
        } =
        await useMultiFileAuthState(
            SESSION_PATH
        )

        const {
            version
        } =
        await fetchLatestBaileysVersion()

        console.log(
            'USING VERSION:',
            version
        )

        const sock =
            makeWASocket({

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

        const code =
            await sock.requestPairingCode(
                number
            )

        console.log(
            'PAIR CODE:',
            code
        )

        return res.send(code)

    } catch (err) {

        console.log(
            'PAIR ROUTE ERROR'
        )

        console.log(err)

        return res.send(
            'FAILED'
        )
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
