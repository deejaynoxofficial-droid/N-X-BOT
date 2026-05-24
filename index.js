require('dotenv').config()

//======================================== // IMPORTS //========================================

const express = require('express')

const app = express()

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')

const pino = require('pino')

const fs = require('fs')

const path = require('path')

const axios = require('axios')

const chalkImport = require('chalk')

const chalk = chalkImport.default || chalkImport

const settings = require('./settings')

const { handleCommand } = require('./handler/commandHandler')

const { handleListeners } = require('./handler/listenerHandler')

const { getUser, getGroup } = require('./database/database')

//======================================== // OPTIONAL HANDLER //========================================

let autoViewOnceHandler = null

try {

autoViewOnceHandler =
    require('./handler/autoViewOnce')

} catch {}

//======================================== // GLOBALS //========================================

let reconnecting = false

let activeSocket = null

let sock = null

const sessions = new Map()

//======================================== // EXPRESS STATIC WEBSITE //========================================

app.use(

express.static(

    path.join(
        __dirname,
        'public'
    )
)

)

//======================================== // SESSION VALIDATOR //========================================

function isSessionValid(sessionPath) {

try {

    const credsPath =
        path.join(
            sessionPath,
            'creds.json'
        )

    return fs.existsSync(credsPath)

} catch {

    return false
}

}

//======================================== // SOCKET MANAGER //========================================

async function createPairSocket(phone) {

try {

    //========================================
    // RETURN EXISTING SOCKET
    //========================================

    if (sessions.has(phone)) {

        return sessions.get(phone)
    }

    //========================================
    // SESSION PATH
    //========================================

    const sessionPath =

        path.join(
            __dirname,
            'sessions',
            phone
        )

    if (!fs.existsSync(sessionPath)) {

        fs.mkdirSync(
            sessionPath,
            {
                recursive: true
            }
        )
    }

    //========================================
    // FIX BAD SESSION
    //========================================

    if (!isSessionValid(sessionPath)) {

        try {

            fs.rmSync(sessionPath, {
                recursive: true,
                force: true
            })

            fs.mkdirSync(sessionPath, {
                recursive: true
            })

        } catch {}
    }

    //========================================
    // AUTH STATE
    //========================================

    const {
        state,
        saveCreds
    } =
    await useMultiFileAuthState(
        sessionPath
    )

    //========================================
    // VERSION
    //========================================

    const {
        version
    } =
    await fetchLatestBaileysVersion()

    //========================================
    // CREATE SOCKET
    //========================================

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

            shouldSyncHistoryMessage: () => false
        })

    //========================================
    // SAVE CREDS
    //========================================

    pairSock.ev.on(
        'creds.update',
        saveCreds
    )

    //========================================
    // SAVE SOCKET
    //========================================

    sessions.set(
        phone,
        pairSock
    )

    //========================================
    // CONNECTION UPDATE
    //========================================

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

                // CONNECTED
                if (
                    connection ===
                    'open'
                ) {

                    console.log(

                        chalk.green(
                            `${phone} CONNECTED`
                        )
                    )
                }

                // CLOSED
                if (
                    connection ===
                    'close'
                ) {

                    console.log(

                        chalk.red(
                            `${phone} DISCONNECTED`
                        )
                    )

                    // LOGGED OUT
                    if (
                        statusCode ===
                        DisconnectReason.loggedOut
                    ) {

                        cleanupSession(phone)

                        return
                    }

                    // RECONNECT
                    setTimeout(async () => {

                        try {

                            sessions.delete(phone)

                            await createPairSocket(phone)

                        } catch (err) {

                            console.log(err)
                        }

                    }, 5000)
                }

            } catch (err) {

                console.log(
                    err
                )
            }
        }
    )

    return pairSock

} catch (err) {

    console.log(
        err
    )
}

}

//======================================== // CLEANUP SESSION //========================================

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
        err
    )
}

}

//======================================== // CREATE REQUIRED FOLDERS //========================================

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

//======================================== // START BOT //========================================

async function startBot() {

try {

    //========================================
    // CLOSE OLD SOCKET
    //========================================

    if (activeSocket) {

        try {

            activeSocket.ws.close()

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
    // FETCH VERSION
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

        shouldSyncHistoryMessage: () => false
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

                const msg =
                    messages?.[0]

                if (
                    !msg ||
                    !msg.message
                ) {
                    return
                }

                if (
                    msg.key &&
                    msg.key.fromMe
                ) return

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

                if (
                    settings.autoRead
                ) {

                    try {

                        await sock.readMessages([
                            msg.key
                        ])

                    } catch {}
                }

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

                if (
                    global.autoReplyEnabled ===
                    true
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

//======================================== // PAIR API //========================================

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

        //========================================
        // CREATE USER SOCKET
        //========================================

        const pairSock =
            await createPairSocket(
                cleanNumber
            )

        //========================================
        // ALREADY CONNECTED
        //========================================

        if (
            pairSock.authState?.creds?.registered
        ) {

            return res.send(
                'NUMBER ALREADY CONNECTED'
            )
        }

        //========================================
        // WAIT FIX
        //========================================

        await new Promise(resolve =>

            setTimeout(
                resolve,
                5000
            )
        )

        //========================================
        // GENERATE CODE
        //========================================

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

            chalk.red(
                'PAIR API ERROR:'
            ),

            err
        )

        res.send(
            'FAILED'
        )
    }
}

)

//======================================== // ROOT PAGE //========================================

app.get( '/', (req, res) => {

res.sendFile(
        path.join(
            __dirname,
            'public',
            'index.html'
        )
    )
}

)

//======================================== // AUTO CLEAN DEAD SESSIONS //========================================

setInterval(() => {

try {

    sessions.forEach((socket, phone) => {

        try {

            if (
                !socket ||
                socket.ws.readyState !== 1
            ) {

                sessions.delete(phone)

                console.log(
                    `REMOVED DEAD SOCKET: ${phone}`
                )
            }

        } catch {}
    })

} catch {}

}, 600000)

//======================================== // RENDER KEEP ALIVE //========================================

if (process.env.RENDER_EXTERNAL_URL) {

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

//======================================== // START EXPRESS + BOT //========================================

const PORT = process.env.PORT || 3000

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
