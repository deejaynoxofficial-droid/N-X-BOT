const fs = require('fs')

const path = require('path')

//========================================
// LISTENER STORAGE
//========================================

const listeners = []

//========================================
// MENU REPLY HANDLER
//========================================

let menuReplyHandler = null

try {

    const menuCommand =
        require('../commands/menu')

    if (
        typeof menuCommand.replyHandler ===
        'function'
    ) {

        menuReplyHandler =
            menuCommand.replyHandler
    }

} catch (error) {

    console.log(
        '❌ Failed To Load Menu Reply Handler'
    )

    console.log(error)
}

//========================================
// LISTENER FOLDER
//========================================

const listenerPath =

    path.join(
        __dirname,
        '../listeners'
    )

//========================================
// CREATE LISTENER FOLDER
//========================================

if (
    !fs.existsSync(listenerPath)
) {

    fs.mkdirSync(
        listenerPath,
        {
            recursive: true
        }
    )
}

//========================================
// LOAD LISTENER FILES
//========================================

const listenerFiles =

    fs.readdirSync(listenerPath)

        .filter(
            file =>
                file.endsWith('.js')
        )

//========================================
// IMPORT LISTENERS
//========================================

for (const file of listenerFiles) {

    try {

        const listener =
            require(
                `../listeners/${file}`
            )

        if (
            typeof listener ===
            'function'
        ) {

            listeners.push({

                name: file,

                execute: listener
            })

            console.log(
                `✅ Listener Loaded: ${file}`
            )

        } else {

            console.log(
                `❌ Invalid Listener: ${file}`
            )
        }

    } catch (error) {

        console.log(
            `❌ Failed To Load Listener: ${file}`
        )

        console.log(error)
    }
}

//========================================
// HANDLE LISTENERS
//========================================

async function handleListeners(
    sock,
    messages
) {

    try {

        //========================================
        // SOCKET CHECK
        //========================================

        if (
            !sock ||
            typeof sock !== 'object'
        ) {
            return
        }

        //========================================
        // MESSAGE ARRAY CHECK
        //========================================

        if (
            !Array.isArray(messages)
        ) {
            return
        }

        //========================================
        // GET FIRST MESSAGE
        //========================================

        const msg =
            messages?.[0]

        if (
            !msg ||
            !msg.message
        ) {
            return
        }

        //========================================
        // IGNORE OWN MESSAGES
        //========================================

        if (
            msg.key?.fromMe
        ) {
            return
        }

        //========================================
        // IGNORE STATUS
        //========================================

        if (
            msg.key?.remoteJid ===
            'status@broadcast'
        ) {
            return
        }

        //========================================
        // MENU REPLY HANDLER
        //========================================

        try {

            if (
                menuReplyHandler
            ) {

                await menuReplyHandler(
                    sock,
                    msg
                )
            }

        } catch (menuError) {

            console.log(
                '❌ MENU REPLY ERROR:'
            )

            console.log(menuError)
        }

        //========================================
        // NO LISTENERS
        //========================================

        if (
            listeners.length === 0
        ) {
            return
        }

        //========================================
        // EXECUTE LISTENERS
        //========================================

        for (const listener of listeners) {

            try {

                if (
                    !listener ||
                    typeof listener !==
                    'object'
                ) {
                    continue
                }

                if (
                    typeof listener.execute !==
                    'function'
                ) {
                    continue
                }

                await listener.execute(
                    sock,
                    messages
                )

            } catch (listenerError) {

                console.log(

`❌ Listener Error (${listener.name})`

                )

                console.log(listenerError)
            }
        }

    } catch (error) {

        console.log(
            '❌ ListenerHandler Error:'
        )

        console.log(error)
    }
}

//========================================
// EXPORTS
//========================================

module.exports = {

    handleListeners
}
