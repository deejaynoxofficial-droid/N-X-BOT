require('dotenv').config()

//========================================
// IMPORTS
//========================================

const express = require('express')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const pino = require('pino')

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const chalkImport =
    require('chalk')

const chalk =
    chalkImport.default ||
    chalkImport

//========================================
// SETTINGS
//========================================

const settings = {

    sessionFolder:
        './sessions',

    tempFolder:
        './temp',

    logsFolder:
        './logs',

    autoRead: false,

    autoTyping: false,

    autoRecording: false
}

//========================================
// EXPRESS
//========================================

const app = express()

app.use(
    express.json()
)

app.use(
    express.urlencoded({
        extended: true
    })
)

app.use(
    express.static(
        path.join(
            __dirname,
            'public'
        )
    )
)

//========================================
// GLOBALS
//========================================

let sock = null
let reconnecting = false

//========================================
// CREATE FOLDERS
//========================================

function createFolders() {

    const folders = [

        settings.sessionFolder,

        settings.tempFolder,

        settings.logsFolder
    ]

    for (const folder of folders) {

        try {

            if (
                !fs.existsSync(folder)
            ) {

                fs.mkdirSync(
                    folder,
                    {
                        recursive: true
                    }
                )
            }

        } catch (err) {

            console.log(
                'FOLDER ERROR:',
                err
            )
        }
    }
}

//========================================
// START BOT
//========================================

async function startBot() {

    try {

        createFolders()

        const {
            state,
            saveCreds
        } =
        await useMultiFileAuthState(
            settings.sessionFolder
        )

        const {
            version
        } =
        await fetchLatestBaileysVersion()

        console.log(

            chalk.cyan(
                `USING VERSION: ${version}`
            )
        )

        sock = makeWASocket({

            auth: state,

            version,

            logger: pino({
                level: 'silent'
            }),

            printQRInTerminal: false,

            browser: [

                'Ubuntu',

                'Chrome',

                '20.0.04'
            ],

            connectTimeoutMs:
                60000,

            keepAliveIntervalMs:
                10000,

            defaultQueryTimeoutMs:
                60000,

            syncFullHistory: false,

            markOnlineOnConnect: false
        })

        //========================================
        // SAVE CREDS
        //========================================

        sock.ev.on(
            'creds.update',
            saveCreds
        )

        //========================================
        // MESSAGE LOGS
        //========================================

        sock.ev.on(

            'messages.upsert',

            async ({
                messages
            }) => {

                try {

                    const msg =
                        messages?.[0]

                    if (!msg) {
                        return
                    }

                    if (!msg.message) {
                        return
                    }

                    const from =
                        msg.key?.remoteJid

                    if (
                        !from ||
                        from ===
                        'status@broadcast'
                    ) {
                        return
                    }

                    const body =

                        msg.message
                            ?.conversation ||

                        msg.message
                            ?.extendedTextMessage
                            ?.text ||

                        msg.message
                            ?.imageMessage
                            ?.caption ||

                        msg.message
                            ?.videoMessage
                            ?.caption ||

                        ''

                    if (!body) {
                        return
                    }

                    console.log(
                        chalk.green(
                            `📩 MESSAGE: ${body}`
                        )
                    )

                    //========================================
                    // AUTO READ
                    //========================================

                    if (
                        settings.autoRead
                    ) {

                        try {

                            await sock.readMessages([
                                msg.key
                            ])

                        } catch {}
                    }

                } catch (err) {

                    console.log(
                        'MESSAGE ERROR:',
                        err
                    )
                }
            }
        )

        //========================================
        // CONNECTION UPDATE
        //========================================

        sock.ev.on(

            'connection.update',

            async ({
                connection,
                lastDisconnect
            }) => {

                try {

                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode

                    //========================================
                    // CONNECTING
                    //========================================

                    if (
                        connection ===
                        'connecting'
                    ) {

                        console.log(

                            chalk.yellow(
                                'CONNECTING TO WHATSAPP...'
                            )
                        )
                    }

                    //========================================
                    // CONNECTED
                    //========================================

                    if (
                        connection ===
                        'open'
                    ) {

                        reconnecting =
                            false

                        console.log(

                            chalk.green(
                                '✅ BOT CONNECTED'
                            )
                        )

                        console.log(

                            chalk.cyan(
                                `CONNECTED AS: ${sock.user?.id}`
                            )
                        )
                    }

                    //========================================
                    // CLOSED
                    //========================================

                    if (
                        connection ===
                        'close'
                    ) {

                        console.log(

                            chalk.red(
                                `❌ CONNECTION CLOSED: ${statusCode}`
                            )
                        )

                        if (
                            statusCode ===
                            DisconnectReason.loggedOut
                        ) {

                            console.log(

                                chalk.red(
                                    'SESSION LOGGED OUT'
                                )
                            )

                            return
                        }

                        if (
                            reconnecting
                        ) {
                            return
                        }

                        reconnecting =
                            true

                        console.log(

                            chalk.yellow(
                                'RECONNECTING...'
                            )
                        )

                        setTimeout(
                            () => {

                                startBot()

                            },
                            5000
                        )
                    }

                } catch (err) {

                    console.log(
                        'CONNECTION ERROR:',
                        err
                    )
                }
            }
        )

    } catch (err) {

        console.log(
            'START BOT ERROR:',
            err
        )

        setTimeout(
            () => {

                startBot()

            },
            5000
        )
    }
}

//========================================
// PAIR CODE API
//========================================

app.get(

    '/pair',

    async (req, res) => {

        try {

            const number =
                req.query.number

            if (!number) {

                return res.json({

                    status: false,

                    message:
                        'Number required'
                })
            }

            const cleanNumber =
                number.replace(
                    /[^0-9]/g,
                    ''
                )

            if (
                cleanNumber.length < 8
            ) {

                return res.json({

                    status: false,

                    message:
                        'Invalid number'
                })
            }

            //========================================
            // WAIT FOR SOCKET
            //========================================

            if (!sock) {

                return res.json({

                    status: false,

                    message:
                        'Socket not ready'
                })
            }

            //========================================
            // GENERATE CODE
            //========================================

            const code =
                await sock.requestPairingCode(
                    cleanNumber
                )

            console.log(

                chalk.green(
                    `PAIR CODE FOR ${cleanNumber}: ${code}`
                )
            )

            return res.json({

                status: true,

                code
            })

        } catch (err) {

            console.log(
                'PAIR ERROR:',
                err
            )

            return res.json({

                status: false,

                message:
                    'Pairing failed'
            })
        }
    }
)

//========================================
// ROOT
//========================================

app.get(
    '/',
    (req, res) => {

        res.send(
            'NOX SPARROW BOT RUNNING'
        )
    }
)

//========================================
// KEEP ALIVE
//========================================

if (
    process.env.RENDER_EXTERNAL_URL
) {

    setInterval(

        async () => {

            try {

                await axios.get(
                    process.env
                        .RENDER_EXTERNAL_URL
                )

                console.log(
                    'KEEP ALIVE SUCCESS'
                )

            } catch {}
        },

        240000
    )
}

//========================================
// START SERVER
//========================================

const PORT =
    process.env.PORT || 3000

app.listen(

    PORT,

    () => {

        console.log(

            chalk.green(
                `SERVER RUNNING ON ${PORT}`
            )
        )

        startBot()
    }
)
