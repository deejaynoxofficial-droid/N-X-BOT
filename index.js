require('dotenv').config()

//========================================
// IMPORTS
//========================================

const express = require('express')

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const fs = require('fs')
const path = require('path')
const chalkImport = require('chalk')

const chalk =
    chalkImport.default ||
    chalkImport

//========================================
// SETTINGS
//========================================

const settings = {

    botName:
        'NOX SPARROW BOT',

    ownerNumber:
        '256748752152',

    prefix:
        '.',

    sessionFolder:
        './sessions',

    botImage:
        './public/bot.jpg',

    timezone:
        'Africa/Kampala'
}

//========================================
// EXPRESS SERVER
//========================================

const app = express()

app.use(
    express.static(
        path.join(
            __dirname,
            'public'
        )
    )
)

//========================================
// HOME PAGE
//========================================

app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'public',
            'index.html'
        )
    )
})

//========================================
// GLOBAL SOCKET
//========================================

let activeSocket = null

//========================================
// PAIR ROUTE
//========================================

app.get('/pair', async (req, res) => {

    try {

        let number =
            req.query.number

        if (!number) {

            return res.send(
                'ENTER NUMBER'
            )
        }

        if (!activeSocket) {

            return res.send(
                'BOT NOT READY'
            )
        }

        //========================================
        // FORMAT NUMBER
        //========================================

        number =
            number.replace(
                /[^0-9]/g,
                ''
            )

        //========================================
        // CHECK SESSION
        //========================================

        if (
            activeSocket.authState
                ?.creds
                ?.registered
        ) {

            return res.send(
                'CONNECTED'
            )
        }

        //========================================
        // GENERATE CODE
        //========================================

        const code =
            await activeSocket.requestPairingCode(
                number
            )

        console.log(
            chalk.green(
                `PAIR CODE FOR ${number}: ${code}`
            )
        )

        return res.send(code)

    } catch (err) {

        console.log(
            chalk.red(
                'PAIR ERROR:'
            ),
            err
        )

        return res.send(
            'FAILED'
        )
    }
})

//========================================
// CREATE FOLDERS
//========================================

function createFolders() {

    const folders = [

        './sessions',

        './public',

        './temp',

        './database'
    ]

    for (const folder of folders) {

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
    }
}

//========================================
// START BOT
//========================================

async function startBot() {

    try {

        createFolders()

        //========================================
        // AUTH STATE
        //========================================

        const {
            state,
            saveCreds
        } =
        await useMultiFileAuthState(
            settings.sessionFolder
        )

        //========================================
        // BAILEYS VERSION
        //========================================

        const {
            version
        } =
        await fetchLatestBaileysVersion()

        console.log(
            chalk.cyan(
                `USING VERSION: ${version}`
            )
        )

        //========================================
        // CREATE SOCKET
        //========================================

        const sock =
            makeWASocket({

                logger: pino({
                    level: 'silent'
                }),

                auth: state,

                version,

                browser: [

                    settings.botName,

                    'Chrome',

                    '1.0.0'
                ],

                printQRInTerminal: false,

                markOnlineOnConnect: true,

                syncFullHistory: false,

                defaultQueryTimeoutMs: 60000,

                connectTimeoutMs: 60000,

                keepAliveIntervalMs: 10000,

                generateHighQualityLinkPreview: true
            })

        activeSocket = sock

        //========================================
        // SAVE CREDS
        //========================================

        sock.ev.on(
            'creds.update',
            saveCreds
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
                    // OPEN
                    //========================================

                    if (
                        connection ===
                        'open'
                    ) {

                        console.log(
                            chalk.green(
                                '\nBOT CONNECTED SUCCESSFULLY\n'
                            )
                        )

                        console.log(
                            chalk.cyan(
                                `CONNECTED AS: ${sock.user?.id}\n`
                            )
                        )
                    }

                    //========================================
                    // CLOSE
                    //========================================

                    if (
                        connection ===
                        'close'
                    ) {

                        console.log(
                            chalk.red(
                                `CONNECTION CLOSED: ${statusCode}`
                            )
                        )

                        //========================================
                        // LOGGED OUT
                        //========================================

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

                        //========================================
                        // RECONNECT
                        //========================================

                        console.log(
                            chalk.yellow(
                                'RECONNECTING...'
                            )
                        )

                        setTimeout(() => {

                            startBot()

                        }, 5000)
                    }

                } catch (err) {

                    console.log(
                        chalk.red(
                            'CONNECTION ERROR:'
                        ),
                        err
                    )
                }
            }
        )

        //========================================
        // MESSAGE EVENT
        //========================================

        sock.ev.on(
            'messages.upsert',
            async ({
                messages
            }) => {

                try {

                    const msg =
                        messages?.[0]

                    if (
                        !msg ||
                        !msg.message
                    ) {
                        return
                    }

                    const from =
                        msg.key
                            ?.remoteJid

                    if (
                        from ===
                        'status@broadcast'
                    ) {
                        return
                    }

                    //========================================
                    // GET BODY
                    //========================================

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

                    //========================================
                    // PREFIX
                    //========================================

                    if (
                        !body.startsWith(
                            settings.prefix
                        )
                    ) {
                        return
                    }

                    const args =
                        body
                        .slice(
                            settings.prefix.length
                        )
                        .trim()
                        .split(/\s+/)

                    const command =
                        args.shift()
                        ?.toLowerCase()

                    //========================================
                    // PING COMMAND
                    //========================================

                    if (
                        command === 'ping'
                    ) {

                        await sock.sendMessage(
                            from,
                            {
                                text:
`╭━━━〔 🏓 PING STATUS 〕━━━⬣
┃
┃ 🤖 Bot Online
┃ ⚡ Speed Stable
┃ 🚀 NOX SPARROW ACTIVE
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                            },
                            {
                                quoted: msg
                            }
                        )
                    }

                    //========================================
                    // MENU COMMAND
                    //========================================

                    if (
                        command === 'menu'
                    ) {

                        await sock.sendMessage(
                            from,
                            {
                                text:
`╭━━━〔 🤖 NOX SPARROW MENU 〕━━━⬣
┃
┃ .ping
┃ .menu
┃ .alive
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                            },
                            {
                                quoted: msg
                            }
                        )
                    }

                    //========================================
                    // ALIVE COMMAND
                    //========================================

                    if (
                        command === 'alive'
                    ) {

                        await sock.sendMessage(
                            from,
                            {
                                text:
'✅ NOX SPARROW BOT IS RUNNING'
                            },
                            {
                                quoted: msg
                            }
                        )
                    }

                } catch (err) {

                    console.log(
                        chalk.red(
                            'MESSAGE ERROR:'
                        ),
                        err
                    )
                }
            }
        )

    } catch (err) {

        console.log(
            chalk.red(
                'START BOT ERROR:'
            ),
            err
        )

        setTimeout(() => {

            startBot()

        }, 5000)
    }
}

//========================================
// START SERVER
//========================================

const PORT =
    process.env.PORT || 3000

app.listen(PORT, () => {

    console.log(
        chalk.green(
            `SERVER RUNNING ON PORT ${PORT}`
        )
    )
})

//========================================
// START BOT
//========================================

startBot()
