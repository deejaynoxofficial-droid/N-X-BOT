require('dotenv').config()

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

const app = express()

// ========================================
// SETTINGS
// ========================================

const PORT =
    process.env.PORT || 3000

const SESSION_PATH =
    './sessions'

// ========================================
// STATIC FILES
// ========================================

app.use(
    express.static(
        path.join(__dirname)
    )
)

// ========================================
// HOME PAGE
// ========================================

app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
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

        // ========================================
        // VALIDATION
        // ========================================

        if (!number) {

            return res.send(
                'ENTER NUMBER'
            )
        }

        number =
            number
            .replace(/[^0-9]/g, '')

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

        // ========================================
        // DELETE OLD SESSION
        // ========================================

        try {

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

                console.log(
                    'OLD SESSION REMOVED'
                )
            }

        } catch (err) {

            console.log(
                'SESSION DELETE ERROR'
            )

            console.log(err)
        }

        // ========================================
        // CREATE SESSION
        // ========================================

        const {
            state,
            saveCreds
        } =
        await useMultiFileAuthState(
            SESSION_PATH
        )

        // ========================================
        // FETCH VERSION
        // ========================================

        const {
            version
        } =
        await fetchLatestBaileysVersion()

        console.log(
            'USING VERSION:',
            version
        )

        // ========================================
        // CREATE SOCKET
        // ========================================

        const sock =
            makeWASocket({

                version,

                auth: state,

                printQRInTerminal: false,

                logger: pino({
                    level: 'silent'
                }),

                browser: [

                    'NOX-SPARROW',

                    'Chrome',

                    '1.0.0'
                ]
            })

        // ========================================
        // SAVE CREDS
        // ========================================

        sock.ev.on(
            'creds.update',
            saveCreds
        )

        let codeSent = false

        // ========================================
        // CONNECTION UPDATE
        // ========================================

        sock.ev.on(
            'connection.update',

            async ({
                connection,
                lastDisconnect
            }) => {

                console.log(
                    'CONNECTION:',
                    connection
                )

                // ========================================
                // WAIT FOR OPEN
                // ========================================

                if (
                    connection === 'open' &&
                    !codeSent
                ) {

                    try {

                        codeSent = true

                        console.log(
                            'REQUESTING PAIR CODE FOR:',
                            number
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
                            'PAIR CODE ERROR'
                        )

                        console.log(err)

                        return res.send(
                            'FAILED'
                        )
                    }
                }

                // ========================================
                // CONNECTION CLOSED
                // ========================================

                if (
                    connection === 'close'
                ) {

                    const reason =
                        lastDisconnect
                        ?.error
                        ?.output
                        ?.statusCode

                    console.log(
                        'DISCONNECTED:',
                        reason
                    )

                    if (
                        reason !==
                        DisconnectReason.loggedOut
                    ) {

                        console.log(
                            'RECONNECTING...'
                        )
                    }
                }
            }
        )

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
