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

const sessions = new Map()

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
// CREATE PAIR SOCKET
//========================================

async function createPairSocket(
    phone
) {

    try {

        if (
            sessions.has(phone)
        ) {

            return sessions.get(phone)
        }

        const sessionPath =
            path.join(
                __dirname,
                'sessions',
                phone
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
                    'Nox Sparrow',
                    'Chrome',
                    '1.0.0'
                ],

                printQRInTerminal: false,

                markOnlineOnConnect: false,

                syncFullHistory: false,

                fireInitQueries: false,

                generateHighQualityLinkPreview: false,

                defaultQueryTimeoutMs: 0,

                connectTimeoutMs: 60000,

                keepAliveIntervalMs: 10000,

                emitOwnEvents: false
            })

        pairSock.ev.on(
            'creds.update',
            saveCreds
        )

        sessions.set(
            phone,
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
                        `✅ PAIR CONNECTED: ${phone}`
                    )
                }

                if (
                    connection ===
                    'close'
                ) {

                    console.log(
                        `❌ PAIR CLOSED: ${statusCode}`
                    )

                    sessions.delete(phone)
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
                'Nox Sparrow',
                'Chrome',
                '1.0.0'
            ],

            printQRInTerminal: false,

            markOnlineOnConnect: false,

            syncFullHistory: false,

            fireInitQueries: false,

            generateHighQualityLinkPreview: false,

            defaultQueryTimeoutMs: 0,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 10000,

            emitOwnEvents: false
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
                            DisconnectReason.loggedOut
                        ) {

                            console.log(
                                '❌ SESSION LOGGED OUT'
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
// PAIR ROUTE
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
                        'ENTER NUMBER'
                })
            }

            const cleanNumber =
                number.replace(
                    /[^0-9]/g,
                    ''
                )

            console.log(
                `📲 PAIR REQUEST: ${cleanNumber}`
            )

            const pairSock =
                await createPairSocket(
                    cleanNumber
                )

            if (!pairSock) {

                return res.json({

                    status: false,

                    message:
                        'SOCKET FAILED'
                })
            }

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        5000
                    )
            )

            const code =
                await pairSock.requestPairingCode(
                    cleanNumber
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
