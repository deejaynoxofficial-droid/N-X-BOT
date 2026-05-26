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
// SETTINGS
//========================================

const settings =
    require('./settings')

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
// EXPRESS
//========================================

const app = express()

app.use(express.json())

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

const sessions =
    new Map()

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
// CREATE PAIR SOCKET
//========================================

async function createPairSocket(
    number
) {

    try {

        if (
            sessions.has(number)
        ) {

            return sessions.get(number)
        }

        const sessionPath =
            path.join(
                __dirname,
                'sessions',
                number
            )

        if (
            !fs.existsSync(sessionPath)
        ) {

            fs.mkdirSync(
                sessionPath,
                {
                    recursive: true
                }
            )
        }

        const {
            state,
            saveCreds
        } =
        await useMultiFileAuthState(
            sessionPath
        )

        const {
            version
        } =
        await fetchLatestBaileysVersion()

        const pairSock =
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
                ],

                printQRInTerminal: false,

                markOnlineOnConnect: false,

                syncFullHistory: false,

                connectTimeoutMs: 60000,

                keepAliveIntervalMs: 10000,

                defaultQueryTimeoutMs:
                    60000
            })

        pairSock.ev.on(
            'creds.update',
            saveCreds
        )

        sessions.set(
            number,
            pairSock
        )

        pairSock.ev.on(

            'connection.update',

            ({
                connection,
                lastDisconnect
            }) => {

                const statusCode =

                    lastDisconnect
                        ?.error
                        ?.output
                        ?.statusCode

                if (
                    connection ===
                    'open'
                ) {

                    console.log(
                        `✅ PAIR CONNECTED: ${number}`
                    )
                }

                if (
                    connection ===
                    'close'
                ) {

                    console.log(
                        `❌ PAIR CLOSED: ${statusCode}`
                    )

                    sessions.delete(number)
                }
            }
        )

        return pairSock

    } catch (err) {

        console.log(
            'PAIR SOCKET ERROR:',
            err
        )

        return null
    }
}

//========================================
// PAIR ROUTE
//========================================

app.get(

    '/pair',

    async (req, res) => {

        try {

            let number =
                req.query.number

            if (!number) {

                return res.json({

                    status: false,

                    message:
                        'ENTER NUMBER'
                })
            }

            number =
                number.replace(
                    /[^0-9]/g,
                    ''
                )

            console.log(
                `📲 PAIR REQUEST: ${number}`
            )

            const pairSock =
                await createPairSocket(
                    number
                )

            if (!pairSock) {

                return res.json({

                    status: false,

                    message:
                        'SOCKET FAILED'
                })
            }

            //========================================
            // WAIT BEFORE REQUESTING CODE
            //========================================

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        8000
                    )
            )

            const code =
                await pairSock.requestPairingCode(
                    number
                )

            console.log(
                `✅ PAIR CODE: ${code}`
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
                    'PAIRING FAILED'
            })
        }
    }
)

//========================================
// START BOT
//========================================

async function startBot() {

    try {

        if (activeSocket) {

            try {

                activeSocket.end()

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
                60000
        })

        activeSocket = sock

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
                        msg.key?.remoteJid

                    if (
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

                    console.log(
                        `📩 ${body || 'NO TEXT'}`
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

                    } catch {}

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

                    if (
                        connection ===
                        'connecting'
                    ) {

                        console.log(
                            'CONNECTING...'
                        )
                    }

                    if (
                        connection ===
                        'open'
                    ) {

                        reconnecting =
                            false

                        console.log(
                            '✅ BOT CONNECTED'
                        )

                        console.log(
                            `CONNECTED AS: ${sock.user?.id}`
                        )
                    }

                    if (
                        connection ===
                        'close'
                    ) {

                        console.log(
                            `❌ CONNECTION CLOSED: ${statusCode}`
                        )

                        if (

                            statusCode ===
                            DisconnectReason.loggedOut ||

                            statusCode ===
                            401
                        ) {

                            console.log(
                                'SESSION LOGGED OUT'
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
                            '🔄 RECONNECTING...'
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
