require('dotenv').config()

// ========================================
// EXPRESS SERVER
// ========================================

const express = require('express')
const app = express()

app.use(express.json())

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {

    res.send('NOX-SPARROW BOT RUNNING')
})

// ========================================
// IMPORTS
// ========================================

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const fs = require('fs')
const path = require('path')

const chalkImport = require('chalk')

const chalk =
    chalkImport.default ||
    chalkImport

// ========================================
// SETTINGS
// ========================================

const settings = {

    botName:
        'NOX-SPARROW',

    prefix:
        '.',

    sessionFolder:
        './sessions',

    tempFolder:
        './temp',

    logsFolder:
        './logs',

    autoRead:
        true,

    autoTyping:
        false,

    autoRecording:
        false
}

// ========================================
// OPTIONAL HANDLERS
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

    const cmd =
        require('./handler/commandHandler')

    handleCommand =
        cmd.handleCommand

} catch {

    console.log(
        chalk.red(
            'COMMAND HANDLER NOT FOUND'
        )
    )
}

try {

    const listener =
        require('./handler/listenerHandler')

    handleListeners =
        listener.handleListeners

} catch {

    console.log(
        chalk.yellow(
            'LISTENER HANDLER NOT FOUND'
        )
    )
}

try {

    autoViewOnceHandler =
        require('./handler/autoViewOnce')

} catch {

    console.log(
        chalk.yellow(
            'AUTO VIEWONCE NOT FOUND'
        )
    )
}

try {

    const database =
        require('./database/database')

    getUser =
        database.getUser

    getGroup =
        database.getGroup

} catch {

    console.log(
        chalk.yellow(
            'DATABASE NOT FOUND'
        )
    )
}

// ========================================
// GLOBALS
// ========================================

let sock = null
let reconnecting = false

// ========================================
// CREATE FOLDERS
// ========================================

function createFolders() {

    const folders = [

        './sessions',

        './temp',

        './logs',

        './database',

        './temp/audio',

        './temp/video',

        './temp/image',

        './temp/sticker',

        './temp/downloads'
    ]

    for (const folder of folders) {

        try {

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

        } catch (err) {

            console.log(
                chalk.red(
                    'FOLDER ERROR:'
                ),
                err
            )
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

            const pairPath =
                `./sessions/${number}`

            if (
                !fs.existsSync(
                    pairPath
                )
            ) {

                fs.mkdirSync(
                    pairPath,
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
                pairPath
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

                    auth: state,

                    logger: pino({
                        level: 'silent'
                    }),

                    browser:
                        Browsers.windows(
                            'Chrome'
                        ),

                    printQRInTerminal:
                        false,

                    syncFullHistory:
                        false,

                    markOnlineOnConnect:
                        false,

                    connectTimeoutMs:
                        60000,

                    defaultQueryTimeoutMs:
                        60000,

                    keepAliveIntervalMs:
                        10000
                })

            pairSock.ev.on(
                'creds.update',
                saveCreds
            )

            // ========================================
            // WAIT CONNECTION
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
            // GENERATE CODE
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
                ),
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

// ========================================
// START BOT
// ========================================

async function startBot() {

    try {

        // ========================================
        // CLOSE OLD SOCKET
        // ========================================

        if (sock) {

            try {

                sock.end()

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
                `USING VERSION: ${version}`
            )
        )

        // ========================================
        // SOCKET
        // ========================================

        sock =
            makeWASocket({

                version,

                auth: state,

                logger: pino({
                    level: 'silent'
                }),

                browser: [

                    settings.botName,

                    'Chrome',

                    '1.0.0'
                ],

                printQRInTerminal:
                    false,

                syncFullHistory:
                    false,

                markOnlineOnConnect:
                    true,

                connectTimeoutMs:
                    60000,

                keepAliveIntervalMs:
                    10000,

                defaultQueryTimeoutMs:
                    60000
            })

        // ========================================
        // SAVE CREDS
        // ========================================

        sock.ev.on(
            'creds.update',
            saveCreds
        )

        // ========================================
        // CONNECTION UPDATE
        // ========================================

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

                    // ========================================

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

                    // ========================================

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

                    // ========================================

                    if (
                        connection ===
                        'close'
                    ) {

                        console.log(
                            chalk.red(
                                `DISCONNECTED: ${statusCode}`
                            )
                        )

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

                        if (
                            reconnecting
                        ) return

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
                        chalk.red(
                            'CONNECTION ERROR:'
                        ),
                        err
                    )
                }
            }
        )

        // ========================================
        // MESSAGE EVENT
        // ========================================

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

                    // ========================================

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
                    // MESSAGE BODY
                    // ========================================

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
                        chalk.green(
                            `MESSAGE: ${body}`
                        )
                    )

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
                    // AUTO VIEWONCE
                    // ========================================

                    if (

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
                            chalk.red(
                                'LISTENER ERROR:'
                            ),
                            err
                        )
                    }

                    // ========================================
                    // PREFIX CHECK
                    // ========================================

                    if (
                        !body.startsWith(
                            settings.prefix
                        )
                    ) return

                    const args =
                        body
                            .slice(
                                settings.prefix.length
                            )
                            .trim()
                            .split(/ +/)

                    const command =
                        args.shift()
                            .toLowerCase()

                    // ========================================
                    // COMMAND HANDLER
                    // ========================================

                    try {

                        await handleCommand(
                            sock,
                            msg,
                            command,
                            args
                        )

                    } catch (err) {

                        console.log(
                            chalk.red(
                                'COMMAND ERROR:'
                            ),
                            err
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

app.listen(
    PORT,
    () => {

        console.log(
            chalk.green(
                `SERVER RUNNING ON PORT ${PORT}`
            )
        )

        startBot()
    }
)
