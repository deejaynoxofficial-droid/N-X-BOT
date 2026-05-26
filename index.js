require('dotenv').config()

//========================================
// IMPORTS
//========================================

const express = require('express')
const app = express()

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const chalkImport =
    require('chalk')

const chalk =
    chalkImport.default ||
    chalkImport

const settings =
    require('./settings')

const {
    handleCommand
} = require('./handler/commandHandler')

//========================================
// OPTIONAL LISTENER
//========================================

let handleListeners =
    async () => {}

try {

    const listenerHandler =
        require('./handler/listenerHandler')

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
// OPTIONAL VIEWONCE
//========================================

let autoViewOnceHandler =
    null

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
// GLOBALS
//========================================

let reconnecting = false
let activeSocket = null
let sock = null

//========================================
// EXPRESS
//========================================

app.use(
    express.static(
        path.join(
            __dirname,
            'public'
        )
    )
)

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

        './temp/sticker'
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

        if (activeSocket) {

            try {

                activeSocket.ws.close()

            } catch {}
        }

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

            browser: [
                'Ubuntu',
                'Chrome',
                '20.0.04'
            ],

            printQRInTerminal: false,

            syncFullHistory: false,

            markOnlineOnConnect: false,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 10000,

            defaultQueryTimeoutMs:
                60000
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
                    // IGNORE SYSTEM EVENTS
                    //========================================

                    const msgType =
                        Object.keys(
                            msg.message || {}
                        )[0]

                    if (

                        msgType ===
                        'protocolMessage' ||

                        msgType ===
                        'reactionMessage' ||

                        msgType ===
                        'pollUpdateMessage'
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

                        msg.message
                            ?.buttonsResponseMessage
                            ?.selectedButtonId ||

                        msg.message
                            ?.listResponseMessage
                            ?.singleSelectReply
                            ?.selectedRowId ||

                        ''

                    if (body) {

                        console.log(
                            `📩 ${body}`
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
                            msg
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

                    if (
                        connection ===
                        'open'
                    ) {

                        reconnecting =
                            false

                        console.log(

                            chalk.green(
                                'BOT CONNECTED'
                            )
                        )

                        console.log(

                            chalk.cyan(
                                `CONNECTED AS: ${sock.user?.id}`
                            )
                        )
                    }

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
                                    'LOGGED OUT'
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
