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

const chalkImport = require('chalk')

const chalk =
    chalkImport.default ||
    chalkImport

const settings =
    require('./settings')

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

} catch {

    console.log(
        'AUTO VIEWONCE HANDLER NOT FOUND'
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
// EXPRESS STATIC WEBSITE
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
// CREATE REQUIRED FOLDERS
//========================================

function createFolders() {

    const folders = [

        settings.sessionFolder,

        settings.tempFolder,

        settings.logsFolder,

        path.dirname(
            settings.database
        ),

        './sessions',

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

                fs.mkdirSync(folder, {
                    recursive: true
                })
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
// SESSION VALIDATOR
//========================================

function isSessionValid(sessionPath) {

    try {

        const credsPath =

            path.join(
                sessionPath,
                'creds.json'
            )

        return fs.existsSync(
            credsPath
        )

    } catch {

        return false
    }
}

//========================================
// CLEANUP SESSION
//========================================

function cleanupSession(phone) {

    try {

        const sessionPath =

            path.join(
                __dirname,
                'sessions',
                phone
            )

        if (
            fs.existsSync(sessionPath)
        ) {

            fs.rmSync(
                sessionPath,
                {
                    recursive: true,
                    force: true
                }
            )
        }

        sessions.delete(phone)

        console.log(

            chalk.yellow(
                `SESSION REMOVED: ${phone}`
            )
        )

    } catch (err) {

        console.log(
            'SESSION CLEANUP ERROR:',
            err
        )
    }
}

//========================================
// CREATE PAIR SOCKET
//========================================

async function createPairSocket(phone) {

    try {

        if (
            sessions.has(phone)
        ) {

            const existingSocket =
                sessions.get(phone)

            try {

                if (
                    existingSocket &&
                    existingSocket.ws
                ) {

                    return existingSocket
                }

            } catch {}

            sessions.delete(phone)
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

        if (
            !isSessionValid(sessionPath)
        ) {

            try {

                fs.rmSync(
                    sessionPath,
                    {
                        recursive: true,
                        force: true
                    }
                )

                fs.mkdirSync(
                    sessionPath,
                    {
                        recursive: true
                    }
                )

            } catch {}
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
                    'Ubuntu',
                    'Chrome',
                    '20.0.04'
                ],

                printQRInTerminal: false,

                syncFullHistory: false,

                markOnlineOnConnect: false,

                keepAliveIntervalMs: 10000,

                connectTimeoutMs: 60000,

                defaultQueryTimeoutMs: 60000,

                retryRequestDelayMs: 250,

                maxMsgRetryCount: 5,

                qrTimeout: 60000,

                emitOwnEvents: false,

                fireInitQueries: true,

                generateHighQualityLinkPreview: true,

                shouldSyncHistoryMessage:
                    () => false
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
                        connection === 'open'
                    ) {

                        console.log(

                            chalk.green(
                                `${phone} CONNECTED`
                            )
                        )
                    }

                    if (
                        connection === 'close'
                    ) {

                        console.log(

                            chalk.red(
                                `${phone} DISCONNECTED`
                            )
                        )

                        if (
                            statusCode ===
                            DisconnectReason.loggedOut
                        ) {

                            cleanupSession(phone)

                            return
                        }

                        sessions.delete(phone)

                        setTimeout(async () => {

                            try {

                                await createPairSocket(
                                    phone
                                )

                            } catch (err) {

                                console.log(
                                    'PAIR RECONNECT ERROR:',
                                    err
                                )
                            }

                        }, 5000)
                    }

                } catch (err) {

                    console.log(
                        'PAIR SOCKET ERROR:',
                        err
                    )
                }
            }
        )

        return pairSock

    } catch (err) {

        console.log(
            'CREATE PAIR SOCKET ERROR:',
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

                if (
                    activeSocket.ws
                ) {

                    activeSocket.ws.close()
                }

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

            logger:
                pino({
                    level: 'silent'
                }),

            auth: state,

            version,

            browser: [
                'Ubuntu',
                'Chrome',
                '20.0.04'
            ],

            printQRInTerminal: false,

            syncFullHistory: false,

            markOnlineOnConnect: false,

            defaultQueryTimeoutMs: 60000,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 10000,

            emitOwnEvents: false,

            fireInitQueries: true,

            generateHighQualityLinkPreview: true,

            retryRequestDelayMs: 250,

            maxMsgRetryCount: 5,

            qrTimeout: 60000,

            shouldSyncHistoryMessage:
                () => false
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

            async ({ messages }) => {

                try {

                    const msg =
                        messages?.[0]

                    if (
                        !msg ||
                        !msg.message
                    ) {
                        return
                    }

                    if (
                        msg.key?.fromMe &&
                        !settings.selfCommands
                    ) {
                        return
                    }

                    if (
                        msg.key.remoteJid ===
                        'status@broadcast'
                    ) {
                        return
                    }

                    const from =
                        msg.key.remoteJid

                    if (!from) {
                        return
                    }

                    const isGroup =
                        from.endsWith('@g.us')

                    const sender =
                        isGroup
                            ? (
                                msg.key.participant ||
                                ''
                              )
                            : from

                    try {

                        getUser(sender)

                        if (isGroup) {

                            getGroup(from)
                        }

                    } catch (dbError) {

                        console.log(
                            'DATABASE ERROR:',
                            dbError
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
                                'AUTO VIEWONCE ERROR:',
                                viewError
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

                    } catch (listenerError) {

                        console.log(
                            'LISTENER ERROR:',
                            listenerError
                        )
                    }

                    //========================================
                    // COMMANDS + MENU REPLY SYSTEM
                    //========================================

                    try {

                        await handleCommand(
                            sock,
                            msg
                        )

                        //========================================
                        // MENU REPLY HANDLER
                        //========================================

                        try {

                            const menuCommand =
                                require('./commands/menu')

                            if (
                                menuCommand &&
                                typeof menuCommand.replyHandler ===
                                    'function'
                            ) {

                                await menuCommand.replyHandler(
                                    sock,
                                    msg
                                )
                            }

                        } catch (menuReplyError) {

                            console.log(
                                'MENU REPLY ERROR:',
                                menuReplyError
                            )
                        }

                    } catch (cmdError) {

                        console.log(
                            'COMMAND ERROR:',
                            cmdError
                        )
                    }

                } catch (err) {

                    console.log(
                        'MESSAGE EVENT ERROR:',
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
                                'CONNECTING TO WHATSAPP...'
                            )
                        )
                    }

                    if (
                        connection ===
                        'open'
                    ) {

                        reconnecting = false

                        console.log(

                            chalk.green(
                                '\nBOT CONNECTED SUCCESSFULLY\n'
                            )
                        )

                        console.log(

                            chalk.cyan(
                                `CONNECTED AS: ${sock.user?.id || 'UNKNOWN'}`
                            )
                        )
                    }

                    if (
                        connection ===
                        'close'
                    ) {

                        console.log(

                            chalk.red(
                                `CONNECTION CLOSED | STATUS: ${statusCode}`
                            )
                        )

                        if (
                            statusCode ===
                            DisconnectReason.loggedOut ||

                            statusCode === 401
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
                        ) return

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
                        'CONNECTION ERROR:',
                        connError
                    )
                }
            }
        )

    } catch (error) {

        console.log(
            'START BOT ERROR:',
            error
        )

        setTimeout(() => {

            startBot()

        }, 5000)
    }
}

//========================================
// PAIR API
//========================================

app.get(

    '/pair',

    async (req, res) => {

        try {

            const number =
                req.query.number

            if (!number) {

                return res.send(
                    'ENTER PHONE NUMBER'
                )
            }

            const cleanNumber =

                number.replace(
                    /[^0-9]/g,
                    ''
                )

            const pairSock =
                await createPairSocket(
                    cleanNumber
                )

            if (!pairSock) {

                return res.send(
                    'FAILED TO CREATE SOCKET'
                )
            }

            if (
                pairSock.user
            ) {

                return res.send(
                    'NUMBER ALREADY CONNECTED'
                )
            }

            await new Promise(resolve =>

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

                chalk.green(
                    `PAIR CODE GENERATED FOR ${cleanNumber}`
                )
            )

            res.send(code)

        } catch (err) {

            console.log(
                'PAIR API ERROR:',
                err
            )

            res.send(
                'FAILED'
            )
        }
    }
)

//========================================
// ROOT PAGE
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
// AUTO CLEAN DEAD SOCKETS
//========================================

setInterval(() => {

    try {

        sessions.forEach(
            (socket, phone) => {

                try {

                    if (
                        !socket ||
                        !socket.ws
                    ) {

                        sessions.delete(phone)

                        console.log(
                            `REMOVED DEAD SOCKET: ${phone}`
                        )
                    }

                } catch {}
            }
        )

    } catch {}

}, 600000)

//========================================
// RENDER KEEP ALIVE
//========================================

if (
    process.env.RENDER_EXTERNAL_URL
) {

    setInterval(async () => {

        try {

            await axios.get(
                process.env.RENDER_EXTERNAL_URL
            )

            console.log(
                'KEEP ALIVE SUCCESS'
            )

        } catch {}

    }, 240000)
}

//========================================
// START EXPRESS + BOT
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
