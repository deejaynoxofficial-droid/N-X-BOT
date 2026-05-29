require('dotenv').config()

// ========================================
// EXPRESS SERVER
// ========================================

const express = require('express')
const app = express()

// ========================================
// IMPORTS
// ========================================

const fs = require('fs')
const path = require('path')
const pino = require('pino')

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys')

const chalkImport = require('chalk')

const chalk =
    chalkImport.default ||
    chalkImport

const settings = require('./settings')

// ========================================
// SAFE IMPORTS
// ========================================

let handleCommand =
    async () => {}

let handleListeners =
    async () => {}

let autoViewOnceHandler =
    null

let getUser =
    () => {}

let getGroup =
    () => {}

try {

    const commandHandler =
        require('./handler/commandHandler')

    handleCommand =
        commandHandler.handleCommand ||
        async () => {}

} catch (err) {

    console.log(
        '❌ COMMAND HANDLER ERROR'
    )

    console.log(err)
}

try {

    const listenerHandler =
        require('./handler/listenerHandler')

    handleListeners =
        listenerHandler.handleListeners ||
        async () => {}

} catch (err) {

    console.log(
        '❌ LISTENER HANDLER ERROR'
    )
}

try {

    autoViewOnceHandler =
        require('./handler/autoViewOnce')

} catch {}

try {

    const database =
        require('./database/database')

    getUser =
        database.getUser ||
        (() => {})

    getGroup =
        database.getGroup ||
        (() => {})

} catch {

    console.log(
        '❌ DATABASE ERROR'
    )
}

// ========================================
// EXPRESS
// ========================================

app.use(express.json())

app.use(
    express.static(
        path.join(
            __dirname,
            'public'
        )
    )
)

app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'public',
            'index.html'
        )
    )
})

// ========================================
// GLOBALS
// ========================================

let reconnecting = false
let activeSocket = null

// ========================================
// CREATE FOLDERS
// ========================================

function createFolders() {

    const folders = [

        './sessions',

        './temp',

        './temp/audio',

        './temp/video',

        './temp/image',

        './temp/sticker',

        './database',

        './logs'
    ]

    for (const folder of folders) {

        if (
            !fs.existsSync(folder)
        ) {

            fs.mkdirSync(folder, {
                recursive: true
            })
        }
    }
}

createFolders()

// ========================================
// PAIR ROUTE
// ========================================

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

            // ========================================
            // CLEAN NUMBER
            // ========================================

            number =
                number.replace(
                    /[^0-9]/g,
                    ''
                )

            if (
                number.length < 11
            ) {

                return res.json({

                    status: false,

                    message:
                        'INVALID NUMBER'
                })
            }

            console.log(
                chalk.yellow(
                    `PAIR REQUEST: ${number}`
                )
            )

            // ========================================
            // SESSION PATH
            // ========================================

            const sessionPath =
                path.join(
                    __dirname,
                    'sessions',
                    number
                )

            if (
                !fs.existsSync(
                    sessionPath
                )
            ) {

                fs.mkdirSync(
                    sessionPath,
                    {
                        recursive: true
                    }
                )
            }

            // ========================================
            // AUTH
            // ========================================

            const {
                state,
                saveCreds
            } =
            await useMultiFileAuthState(
                sessionPath
            )

            // ========================================
            // VERSION
            // ========================================

            const {
                version
            } =
            await fetchLatestBaileysVersion()

            // ========================================
            // SOCKET
            // ========================================

            const pairSock =
                makeWASocket({

                    version,

                    logger: pino({
                        level: 'silent'
                    }),

                    auth: state,

                    browser:
                        Browsers.windows(
                            'Chrome'
                        ),

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

            // ========================================
            // WAIT FOR CONNECTION
            // ========================================

            await new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const timeout =
                        setTimeout(
                            () => {

                                reject(
                                    new Error(
                                        'TIMEOUT'
                                    )
                                )

                            },
                            20000
                        )

                    pairSock.ev.on(
                        'connection.update',
                        ({
                            connection
                        }) => {

                            if (
                                connection ===
                                'connecting'
                            ) {

                                console.log(
                                    'PAIR CONNECTING...'
                                )
                            }

                            if (
                                connection ===
                                'open'
                            ) {

                                clearTimeout(
                                    timeout
                                )

                                resolve()
                            }
                        }
                    )
                }
            )

            // ========================================
            // GENERATE PAIR CODE
            // ========================================

            const code =
                await pairSock.requestPairingCode(
                    number
                )

            console.log(
                chalk.green(
                    `PAIR CODE: ${code}`
                )
            )

            return res.json({

                status: true,

                code
            })

        } catch (err) {

            console.log(
                chalk.red(
                    'PAIR ERROR:'
                )
            )

            console.log(err)

            return res.json({

                status: false,

                message:
                    'PAIRING FAILED'
            })
        }
    }
)

// ========================================
// START BOT
// ========================================

async function startBot() {

    try {

        // ========================================
        // PREVENT MULTIPLE SOCKETS
        // ========================================

        if (activeSocket) {

            try {

                activeSocket.end()

            } catch {}
        }

        // ========================================
        // AUTH
        // ========================================

        const {
            state,
            saveCreds
        } =
        await useMultiFileAuthState(
            settings.sessionFolder
        )

        // ========================================
        // VERSION
        // ========================================

        const {
            version
        } =
        await fetchLatestBaileysVersion()

        console.log(
            chalk.cyan(
                `BAILEYS VERSION: ${version}`
            )
        )

        // ========================================
        // SOCKET
        // ========================================

        const sock =
            makeWASocket({

                version,

                logger: pino({
                    level: 'silent'
                }),

                auth: state,

                browser:
                    Browsers.windows(
                        'Chrome'
                    ),

                printQRInTerminal: false,

                syncFullHistory: false,

                markOnlineOnConnect: true,

                connectTimeoutMs:
                    settings.connectTimeout,

                keepAliveIntervalMs:
                    settings.socketKeepAlive,

                defaultQueryTimeoutMs:
                    settings.queryTimeout,

                generateHighQualityLinkPreview: true
            })

        activeSocket = sock

        // ========================================
        // SAVE CREDS
        // ========================================

        sock.ev.on(
            'creds.update',
            saveCreds
        )

        // ========================================
        // MESSAGE EVENT
        // ========================================

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
                        msg.key.remoteJid ===
                        'status@broadcast'
                    ) {
                        return
                    }

                    const from =
                        msg.key.remoteJid

                    const isGroup =
                        from.endsWith(
                            '@g.us'
                        )

                    const sender =
                        isGroup
                            ? (
                                msg.key.participant ||
                                ''
                              )
                            : from

                    // ========================================
                    // DATABASE
                    // ========================================

                    try {

                        getUser(sender)

                        if (isGroup) {

                            getGroup(from)
                        }

                    } catch {}

                    // ========================================
                    // AUTO READ
                    // ========================================

                    if (
                        settings.autoRead
                    ) {

                        try {

                            await sock.readMessages([
                                msg.key
                            ])

                        } catch {}
                    }

                    // ========================================
                    // VIEWONCE
                    // ========================================

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

                    // ========================================
                    // LISTENERS
                    // ========================================

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

                    // ========================================
                    // COMMANDS
                    // ========================================

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

        // ========================================
        // CONNECTION UPDATE
        // ========================================

        sock.ev.on(
            'connection.update',
            ({
                connection,
                lastDisconnect
            }) => {

                try {

                    const reason =

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
                                '\nBOT CONNECTED\n'
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
                                `DISCONNECTED: ${reason}`
                            )
                        )

                        // ========================================
                        // LOGGED OUT
                        // ========================================

                        if (

                            reason ===
                            DisconnectReason.loggedOut ||

                            reason === 401

                        ) {

                            console.log(
                                chalk.red(
                                    'SESSION LOGGED OUT'
                                )
                            )

                            return
                        }

                        // ========================================
                        // PREVENT LOOP
                        // ========================================

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
                            settings.reconnectDelay ||
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
            chalk.red(
                'START BOT ERROR:'
            )
        )

        console.log(err)

        setTimeout(
            () => {

                startBot()

            },
            5000
        )
    }
}

// ========================================
// START SERVER
// ========================================

const PORT =
    process.env.PORT || 3000

app.listen(PORT, () => {

    console.log(
        chalk.green(
            `SERVER RUNNING ON ${PORT}`
        )
    )

    startBot()
})
