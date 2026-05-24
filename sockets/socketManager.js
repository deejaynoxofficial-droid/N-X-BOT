const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const fs = require('fs')

const path = require('path')

const pino = require('pino')

const sessions = new Map()

//========================================
// CREATE SOCKET
//========================================

async function createSocket(phone) {

    // RETURN EXISTING SOCKET
    if (sessions.has(phone)) {

        return sessions.get(phone)
    }

    const sessionPath =
        path.join(
            __dirname,
            '../sessions',
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

    const sock =
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

            defaultQueryTimeoutMs: 60000
        })

    sock.ev.on(
        'creds.update',
        saveCreds
    )

    sessions.set(
        phone,
        sock
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

            const statusCode =
                lastDisconnect
                ?.error
                ?.output
                ?.statusCode

            if (connection === 'open') {

                console.log(
                    `${phone} connected`
                )
            }

            if (connection === 'close') {

                console.log(
                    `${phone} disconnected`
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
                setTimeout(() => {

                    createSocket(phone)

                }, 5000)
            }
        }
    )

    return sock
}

//========================================
// CLEANUP
//========================================

function cleanupSession(phone) {

    const sessionPath =
        path.join(
            __dirname,
            '../sessions',
            phone
        )

    if (fs.existsSync(sessionPath)) {

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
        `SESSION REMOVED: ${phone}`
    )
}

module.exports = {

    createSocket,

    cleanupSession,

    sessions
}