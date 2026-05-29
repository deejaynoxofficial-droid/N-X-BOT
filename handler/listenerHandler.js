const fs = require('fs')
const path = require('path')

//========================================
// STORAGE
//========================================

const listeners = []


//========================================
// LISTENER PATH
//========================================

const listenerPath =
    path.join(
        __dirname,
        '../listeners'
    )

//========================================
// CREATE FOLDER
//========================================

try {

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

} catch (err) {

    console.log(
        '❌ LISTENER FOLDER ERROR'
    )

    console.log(err)
}

//========================================
// LOAD LISTENERS
//========================================

try {

    const files =
        fs.readdirSync(listenerPath)
            .filter(file =>
                file.endsWith('.js')
            )

    for (const file of files) {

        try {

            const filePath =
                path.join(
                    listenerPath,
                    file
                )

            delete require.cache[
                require.resolve(filePath)
            ]

            const listener =
                require(filePath)

            if (
                typeof listener !==
                'function'
            ) {

                console.log(
                    `❌ INVALID LISTENER: ${file}`
                )

                continue
            }

            listeners.push({

                name: file,

                execute: listener
            })

            console.log(
                `✅ LISTENER LOADED: ${file}`
            )

        } catch (err) {

            console.log(
                `❌ FAILED TO LOAD: ${file}`
            )

            console.log(err)
        }
    }

} catch (err) {

    console.log(
        '❌ LISTENER LOAD ERROR'
    )

    console.log(err)
}

//========================================
// HANDLE LISTENERS
//========================================

async function handleListeners(
    sock,
    msg
) {

    try {

        //========================================
        // VALIDATION
        //========================================

        if (
            !sock ||
            !msg ||
            !msg.message
        ) {
            return
        }

        //========================================
        // IGNORE OWN
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
        // EXECUTE LISTENERS
        //========================================

        for (const listener of listeners) {

            try {

                if (
                    !listener ||
                    typeof listener.execute !==
                    'function'
                ) {
                    continue
                }

                await listener.execute(
                    sock,
                    msg
                )

            } catch (listenerError) {

                console.log(
                    `❌ LISTENER ERROR: ${listener.name}`
                )

                console.log(listenerError)
            }
        }

    } catch (error) {

        console.log(
            '❌ HANDLE LISTENER ERROR'
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
