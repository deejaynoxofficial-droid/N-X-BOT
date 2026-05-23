const fs = require('fs')
const path = require('path')

//========================================
// LISTENER STORAGE
//========================================

const listeners = []

//========================================
// LISTENER FOLDER
//========================================

const listenerPath = path.join(
    __dirname,
    '../listeners'
)

//========================================
// CREATE LISTENER FOLDER
//========================================

if (
    !fs.existsSync(listenerPath)
) {

    fs.mkdirSync(listenerPath, {
        recursive: true
    })
}

//========================================
// LOAD LISTENER FILES
//========================================

const listenerFiles = fs
    .readdirSync(listenerPath)
    .filter(file =>
        file.endsWith('.js')
    )

//========================================
// IMPORT LISTENERS
//========================================

for (const file of listenerFiles) {

    try {

        const listener = require(
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

        if (
            !sock ||
            typeof sock !== 'object'
        ) {
            return
        }

        if (
            !Array.isArray(messages)
        ) {
            return
        }

        if (
            listeners.length === 0
        ) {
            return
        }

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