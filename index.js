require('dotenv').config()

//========================================
// IMPORTS
//========================================

const express = require('express')
const path = require('path')
const fs = require('fs')

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const pino = require('pino')

const chalkImport =
    require('chalk')

const chalk =
    chalkImport.default ||
    chalkImport

const settings =
    require('./settings')

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
// ROOT HTML
//========================================

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
// IMPORT HANDLERS
//========================================

let handleCommand =
    async () => {}

let handleListeners =
    async () => {}

let autoViewOnceHandler =
    null

try {

    const commandHandler =
        require(
            './handler/commandHandler'
        )

    if (
        typeof commandHandler
            .handleCommand ===
        'function'
    ) {

        handleCommand =
            commandHandler
                .handleCommand
    }

} catch {

    console.log(
        '⚠️ COMMAND HANDLER NOT FOUND'
    )
}

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

try {

    autoViewOnceHandler =
        require(
            './handler/autoViewOnce'
        )

} catch {

    console.log(
        '⚠️ AUTO VIEWONCE NOT FOUND'
    )
}

//========================================
// DATABASE SAFE LOAD
//========================================

try {

    require('./database/database')

} catch {

    console.log(
        '⚠️ DATABASE NOT FOUND'
    )
}

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

        settings.logsFolder,

        './temp',

        './temp/audio',

        './temp/video',

        './temp/image',

        './temp/sticker',

        './temp/downloads'
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
        // VERSION
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

            printQRInTerminal: true,

            markOnlineOnConnect: false,

            syncFullHistory: false,

            defaultQueryTimeoutMs:
                60000,

            connectTimeoutMs:
                60000,

            keepAliveIntervalMs:
                10000,

            emitOwnEvents: false,

            fireInitQueries: true,

            generateHighQualityLinkPreview: true
        })

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

                        reconnecting =
                            false

                        console.log(

                            chalk.green(
                                '\nBOT CONNECTED SUCCESSFULLY\n'
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
                                `CONNECTION CLOSED: ${statusCode}`
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
                                'RECONNECTING IN 5 SECONDS...'
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

                    if (!msg) {
                        return
                    }

                    if (!msg.message) {
                        return
                    }

                    const from =
                        msg.key?.remoteJid

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
                    // BODY
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

                    console.log(
                        `📩 ${body || 'NO TEXT'}`
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
                                messages
                            )

                        } catch {}
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

                    } catch (err) {

                        console.log(
                            'COMMAND ERROR:',
                            err
                        )
                    }

                } catch (err) {

                    console.log(
                        'MESSAGE ERROR:',
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
// START EXPRESS
//========================================

const PORT =
    process.env.PORT || 3000

app.listen(

    PORT,

    () => {

        console.log(

            chalk.green(
                `WEB SERVER RUNNING ON ${PORT}`
            )
        )

        startBot()
    }
)
