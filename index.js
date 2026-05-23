require('dotenv').config()

//========================================
// EXPRESS SERVER (RENDER SAFE)
//========================================

const express = require('express')

const app = express()

app.get('/', (req, res) => {
    res.send('NOX-SPARROW BOT RUNNING')
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {

    console.log(
        `SERVER RUNNING ON PORT ${PORT}`
    )
})

//========================================
// IMPORTS
//========================================

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

const settings = require('./settings')

const {
    handleCommand
} = require('./handler/commandHandler')

const {
    handleListeners
} = require('./handler/listenerHandler')

const {
    getUser,
    getGroup
} = require('./database/database')

//========================================
// OPTIONAL HANDLER
//========================================

let autoViewOnceHandler = null

try {

    autoViewOnceHandler =
        require('./handler/autoViewOnce')

} catch {}

//========================================
// GLOBAL SOCKET PROTECTION
//========================================

let reconnecting = false
let activeSocket = null
let sock = null

//========================================
// CREATE REQUIRED FOLDERS
//========================================

function createFolders() {

    const folders = [

        settings.sessionFolder,

        settings.tempFolder,

        settings.logsFolder,

        path.dirname(settings.database),

        './temp/audio',

        './temp/video',

        './temp/image',

        './temp/sticker',

        './temp/downloads'
    ]

    for (const folder of folders) {

        if (
            folder &&
            !fs.existsSync(folder)
        ) {

            fs.mkdirSync(folder, {
                recursive: true
            })
        }
    }
}

//========================================
// START BOT
//========================================

async function startBot() {

    try {

        //========================================
        // PREVENT DUPLICATE SOCKETS
        //========================================

        if (activeSocket) {

            try {

                activeSocket.end()

            } catch {}
        }

        //========================================
        // CREATE FOLDERS
        //========================================

        createFolders()

        //========================================
        // AUTH STATE
        //========================================

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(
            settings.sessionFolder
        )

        //========================================
        // BAILEYS VERSION
        //========================================

        const {
            version
        } = await fetchLatestBaileysVersion()

        console.log(
            chalk.cyan(
                `USING BAILEYS VERSION: ${version}`
            )
        )

        //========================================
        // CREATE SOCKET
        //========================================

        sock = makeWASocket({

            logger: pino({
                level: 'silent'
            }),

            auth: state,

            version,

            browser: [

                settings.botName ||
                'NOX-SPARROW',

                'Chrome',

                '1.0.0'
            ],

            printQRInTerminal: false,

            syncFullHistory: false,

            markOnlineOnConnect: false,

            defaultQueryTimeoutMs: 60000,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 10000,

            emitOwnEvents: false,

            fireInitQueries: true,

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
        // MESSAGE EVENT
        //========================================

        sock.ev.on(
            'messages.upsert',
            async ({ messages }) => {

                try {

                    const msg = messages?.[0]

                    if (
                        !msg ||
                        !msg.message
                    ) {
                        return
                    }

                    //========================================
                    // IGNORE STATUS
                    //========================================

                    if (
                        msg.key.remoteJid ===
                        'status@broadcast'
                    ) {
                        return
                    }

                    const from =
                        msg.key.remoteJid

                    const isGroup =
                        from.endsWith('@g.us')

                    const sender =
                        isGroup
                            ? (
                                msg.key.participant ||
                                ''
                              )
                            : from

                    //========================================
                    // DATABASE INIT
                    //========================================

                    try {

                        getUser(sender)

                        if (isGroup) {
                            getGroup(from)
                        }

                    } catch (dbError) {

                        console.log(
                            chalk.red(
                                'DATABASE ERROR:'
                            ),
                            dbError
                        )
                    }

                    //========================================
                    // AUTO READ
                    //========================================

                    if (settings.autoRead) {

                        try {

                            await sock.readMessages([
                                msg.key
                            ])

                        } catch {}
                    }

                    //========================================
                    // AUTO TYPING
                    //========================================

                    if (settings.autoTyping) {

                        try {

                            await sock.sendPresenceUpdate(
                                'composing',
                                from
                            )

                        } catch {}
                    }

                    //========================================
                    // AUTO RECORDING
                    //========================================

                    if (settings.autoRecording) {

                        try {

                            await sock.sendPresenceUpdate(
                                'recording',
                                from
                            )

                        } catch {}
                    }

                    //========================================
                    // AUTO VIEW ONCE
                    //========================================

                    if (
                        settings.antiViewOnce &&
                        autoViewOnceHandler
                    ) {

                        try {

                            await autoViewOnceHandler(
                                sock,
                                messages
                            )

                        } catch (viewError) {

                            console.log(
                                chalk.red(
                                    'AUTO VIEWONCE ERROR:'
                                ),
                                viewError
                            )
                        }
                    }

                    //========================================
                    // LISTENER HANDLER
                    //========================================

                    try {

                        await handleListeners(
                            sock,
                            messages
                        )

                    } catch (listenerError) {

                        console.log(
                            chalk.red(
                                'LISTENER ERROR:'
                            ),
                            listenerError
                        )
                    }

                    //========================================
                    // AUTO REPLY
                    //========================================

                    if (
                        global.autoReplyEnabled === true
                    ) {

                        try {

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

                            if (
                                body &&
                                !body.startsWith(
                                    settings.prefix
                                )
                            ) {

                                await sock.sendMessage(
                                    from,
                                    {
                                        text:
                                            global.autoReplyMessage ||
                                            '🤖 I am busy right now.'
                                    }
                                )
                            }

                        } catch {}
                    }

                    //========================================
                    // COMMAND HANDLER
                    //========================================

                    try {

                        await handleCommand(
                            sock,
                            msg
                        )

                    } catch (cmdError) {

                        console.log(
                            chalk.red(
                                'COMMAND ERROR:'
                            ),
                            cmdError
                        )
                    }

                } catch (err) {

                    console.log(
                        chalk.red(
                            'MESSAGE EVENT ERROR:'
                        ),
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
                        lastDisconnect?.error?.output?.statusCode

                    //========================================
                    // CONNECTING
                    //========================================

                    if (connection === 'connecting') {

                        console.log(
                            chalk.yellow(
                                'CONNECTING TO WHATSAPP...'
                            )
                        )
                    }

                    //========================================
                    // OPEN
                    //========================================

                    if (connection === 'open') {

                        reconnecting = false

                        console.log(
chalk.green(
'\nBOT CONNECTED SUCCESSFULLY\n'
)
                        )

                        console.log(
chalk.cyan(
`CONNECTED AS: ${sock.user?.id || 'UNKNOWN'}\n`
)
                        )
                    }

                    //========================================
                    // CLOSE
                    //========================================

                    if (connection === 'close') {

                        console.log(
chalk.red(
`CONNECTION CLOSED | STATUS: ${statusCode}`
)
                        )

                        // LOGGED OUT
                        if (
                            statusCode === DisconnectReason.loggedOut ||
                            statusCode === 401
                        ) {

                            console.log(
chalk.red(
'SESSION LOGGED OUT. GENERATE NEW PAIR CODE.'
)
                            )

                            return
                        }

                        // AVOID MULTIPLE RECONNECTS
                        if (reconnecting) return

                        reconnecting = true

                        console.log(
chalk.yellow(
'RECONNECTING IN 5 SECONDS...'
)
                        )

                        setTimeout(() => {
                            startBot()
                        }, 5000)
                    }

                } catch (connError) {

                    console.log(
                        chalk.red(
                            'CONNECTION ERROR:'
                        ),
                        connError
                    )
                }
            }
        )

    } catch (error) {

        console.log(
            chalk.red(
                'START BOT ERROR:'
            ),
            error
        )

        setTimeout(() => {
            startBot()
        }, 5000)
    }
}

//========================================
// AUTOMATIC PAIRING API
//========================================

app.get('/pair', async (req, res) => {

    try {

        const number =
            req.query.number

        if (!number) {

            return res.send(`
ENTER NUMBER LIKE:

/pair?number=2567XXXXXXXX
`)
        }

        if (!sock) {

            return res.send(
                'BOT NOT READY YET'
            )
        }

        const cleanNumber =
            number.replace(/[^0-9]/g, '')

        const code =
            await sock.requestPairingCode(
                cleanNumber
            )

        console.log(
            chalk.green(
                `PAIR CODE GENERATED FOR ${cleanNumber}`
            )
        )

        res.send(`
<!DOCTYPE html>

<html>

<head>

<title>NOX-SPARROW PAIR</title>

<style>

body{
background:#0f0f0f;
color:white;
font-family:monospace;
text-align:center;
padding-top:80px;
}

.code{
font-size:40px;
color:lime;
}

</style>

</head>

<body>

<h1>NOX-SPARROW BOT</h1>

<h2>PAIRING CODE</h2>

<div class="code">
${code}
</div>

</body>

</html>
`)
    }

    catch (err) {

        console.log(
            chalk.red(
                'PAIR API ERROR:'
            ),
            err
        )

        res.send(
            'FAILED TO GENERATE PAIR CODE'
        )
    }
})

//========================================
// START BOT
//========================================

startBot()
