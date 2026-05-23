require("dotenv").config()

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const chalkImport =
    require('chalk')

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
// OPTIONAL HANDLERS
//========================================

let autoViewOnceHandler = null

try {

    autoViewOnceHandler =
        require('./handler/autoViewOnce')

} catch {}

//========================================
// QUESTION PROMPT
//========================================

async function question(text) {

    const rl =
        readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })

    return new Promise(resolve => {

        rl.question(text, answer => {

            rl.close()

            resolve(answer)
        })
    })
}

//========================================
// START BOT
//========================================

async function startBot() {

    try {

        //========================================
        // CREATE REQUIRED FOLDERS
        //========================================

        const folders = [

    settings.sessionFolder,

    settings.tempFolder,

    settings.logsFolder,

    path.dirname(
        settings.database
    ),

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

        //========================================
        // CREATE SOCKET
        //========================================

        const sock = makeWASocket({

            logger:
                pino({
                    level: 'silent'
                }),

            auth: state,

            version,

            browser: [

                settings.botName ||
                    'NOX-SPARROW',

                'Chrome',

                '1.0.0'
            ]
        })

/* ===============================
   PAIRING CODE SYSTEM
================================ */

if (!client.authState.creds.registered) {

    // Get phone number from .env
    const phoneNumber = process.env.PHONE_NUMBER

    // Request pairing code
    const code = await client.requestPairingCode(phoneNumber)

    // Display pairing code
    console.log(`
╭──────────────────────╮
│   WHATSAPP PAIRING   │
├──────────────────────┤
│  CODE: ${code}  │
╰──────────────────────╯
`)
}

    } catch (pairError) {

        console.log(
            chalk.red(
                'PAIRING ERROR:'
            ),
            pairError
        )
    }
}
        
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

                    if (
                        connection === 'close'
                    ) {

                        const shouldReconnect =

                            lastDisconnect
                                ?.error
                                ?.output
                                ?.statusCode !==
                            DisconnectReason.loggedOut

                        console.log(

chalk.red(
'CONNECTION CLOSED'
)

                        )

                        if (
                            shouldReconnect
                        ) {

                            console.log(

chalk.yellow(
'RECONNECTING...'
)

                            )

                            setTimeout(
                                () => {

                                    startBot()

                                },
                                3000
                            )

                        } else {

                            console.log(

chalk.red(
'LOGGED OUT'
)

                            )
                        }
                    }

                    if (
                        connection === 'open'
                    ) {

                        console.log(

chalk.green(
'\nBOT CONNECTED SUCCESSFULLY\n'
)

                        )

                        console.log(

chalk.cyan(
`CONNECTED AS: ${sock.user.id}\n`
)

                        )
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

        setTimeout(
            () => {

                startBot()

            },
            5000
        )
    }
}

//========================================
// START BOT
//========================================

startBot()
