require('dotenv').config()

//========================================
// IMPORTS
//========================================

const express = require('express')
const fs = require('fs')
const path = require('path')
const pino = require('pino')
const axios = require('axios')

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
// SAFE OPTIONAL MODULES
//========================================

let mega = null

try {

    mega = require('megajs')

    console.log(
        '✅ MEGAJS LOADED'
    )

} catch {

    console.log(
        '⚠️ MEGAJS NOT INSTALLED'
    )
}

//========================================
// SETTINGS
//========================================

const settings =
    require('./settings')

//========================================
// HANDLERS
//========================================

const {
    handleCommand
} =
require('./handler/commandHandler')

let handleListeners =
    async () => {}

try {

    const listenerHandler =
        require(
            './handler/listenerHandler'
        )

    if (
        typeof listenerHandler
            .handleListeners ===
        'function'
    ) {

        handleListeners =
            listenerHandler
                .handleListeners
    }

} catch {

    console.log(
        '⚠️ LISTENER HANDLER NOT FOUND'
    )
}

//========================================
// DATABASE
//========================================

let getUser =
    () => {}

let getGroup =
    () => {}

try {

    const database =
        require(
            './database/database'
        )

    getUser =
        database.getUser ||
        (() => {})

    getGroup =
        database.getGroup ||
        (() => {})

    console.log(
        '✅ DATABASE LOADED'
    )

} catch {

    console.log(
        '⚠️ DATABASE NOT FOUND'
    )
}

//========================================
// OPTIONAL VIEWONCE
//========================================

let autoViewOnceHandler =
    null

try {

    autoViewOnceHandler =
        require(
            './handler/autoViewOnce'
        )

    console.log(
        '✅ AUTO VIEWONCE LOADED'
    )

} catch {

    console.log(
        '⚠️ AUTO VIEWONCE NOT FOUND'
    )
}

//========================================
// EXPRESS
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

app.get(
    '/',
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                'public',
                'index.html'
            )
        )
    }
)

//========================================
// GLOBALS
//========================================

let reconnecting =
    false

let activeSocket =
    null

let sock = null

//========================================
// CREATE FOLDERS
//========================================

function createFolders() {

    const folders = [

        settings.sessionFolder,

        settings.tempFolder,

        settings.logsFolder,

        './sessions',

        './temp',

        './temp/audio',

        './temp/video',

        './temp/image',

        './temp/sticker',

        './database'
    ]

    for (const folder of folders) {

        try {

            if (
                folder &&
                !fs.existsSync(folder)
            ) {

                fs.mkdirSync(
                    folder,
                    {
                        recursive: true
                    }
                )

                console.log(
                    `📁 CREATED: ${folder}`
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

        //========================================
        // CLOSE OLD SOCKET
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

        sock = makeWASocket({

            auth: state,

            version,

            logger: pino({
                level: 'silent'
            }),

            browser: [

                settings.botName ||
                'NOX-SPARROW',

                'Chrome',

                '1.0.0'
            ],

            printQRInTerminal: false,

            syncFullHistory: false,

            markOnlineOnConnect: true,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 10000,

            defaultQueryTimeoutMs:
                60000,

            emitOwnEvents: false,

            fireInitQueries: true,

            generateHighQualityLinkPreview:
                true
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

                    if (!from) {
                        return
                    }

                    //========================================
                    // IGNORE STATUS
                    //========================================

                    if (
                        from ===
                        'status@broadcast'
                    ) {
                        return
                    }

                    //========================================
                    // MESSAGE BODY
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

                        msg.message
                            ?.buttonsResponseMessage
                            ?.selectedButtonId ||

                        msg.message
                            ?.listResponseMessage
                            ?.singleSelectReply
                            ?.selectedRowId ||

                        ''

                    console.log(
                        `📩 MESSAGE: ${body || 'NO TEXT'}`
                    )

                    //========================================
                    // DATABASE INIT
                    //========================================

                    try {

                        const sender =

                            msg.key
                                ?.participant ||

                            from

                        getUser(sender)

                        if (
                            from.endsWith(
                                '@g.us'
                            )
                        ) {

                            getGroup(from)
                        }

                    } catch (dbErr) {

                        console.log(
                            'DATABASE ERROR:',
                            dbErr
                        )
                    }

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

                    //========================================
                    // AUTO TYPING
                    //========================================

                    if (
                        settings.autoTyping
                    ) {

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

                    if (
                        settings.autoRecording
                    ) {

                        try {

                            await sock.sendPresenceUpdate(
                                'recording',
                                from
                            )

                        } catch {}
                    }

                    //========================================
                    // VIEWONCE
                    //========================================

                    if (
                        settings.antiViewOnce &&
                        autoViewOnceHandler
                    ) {

                        try {

                            await autoViewOnceHandler(
                                sock,
                                msg
                            )

                        } catch (err) {

                            console.log(
                                'VIEWONCE ERROR:',
                                err
                            )
                        }
                    }

                    //========================================
                    // LISTENERS
                    //========================================

                    try {

                        await handleListeners(
                            sock,
                            messages
                        )

                    } catch (err) {

                        console.log(
                            'LISTENER ERROR:',
                            err
                        )
                    }

                    //========================================
                    // COMMANDS
                    //========================================

                    try {

                        await handleCommand(
                            sock,
                            msg
                        )

                        console.log(
                            `▶ RUNNING: ${body}`
                        )

                    } catch (err) {

                        console.log(
                            'COMMAND ERROR:',
                            err
                        )
                    }

                } catch (err) {

                    console.log(
                        'MESSAGE UPSERT ERROR:',
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

            ({
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
                                'CONNECTING...'
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
                    // CLOSE
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

                        //========================================
                        // LOGGED OUT
                        //========================================

                        if (

                            statusCode ===
                            DisconnectReason.loggedOut ||

                            statusCode ===
                            401
                        ) {

                            console.log(

                                chalk.red(
                                    'SESSION LOGGED OUT'
                                )
                            )

                            return
                        }

                        //========================================
                        // PREVENT MULTIPLE RECONNECTS
                        //========================================

                        if (
                            reconnecting
                        ) {
                            return
                        }

                        reconnecting =
                            true

                        console.log(

                            chalk.yellow(
                                '🔄 RECONNECTING IN 5 SECONDS...'
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
// KEEP ALIVE
//========================================

if (
    process.env
        .RENDER_EXTERNAL_URL
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
