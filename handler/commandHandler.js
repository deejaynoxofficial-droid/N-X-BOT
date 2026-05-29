const fs = require('fs')
const path = require('path')

const settings = require('../settings')

// ========================================
// SAFE DATABASE IMPORT
// ========================================

let getUser = () => ({})
let getGroup = () => ({})

try {

    const database =
        require('../database/database')

    getUser =
        database.getUser ||
        (() => ({}))

    getGroup =
        database.getGroup ||
        (() => ({}))

} catch {

    console.log(
        '⚠️ DATABASE NOT FOUND'
    )
}

// ========================================
// STORAGE
// ========================================

const commands = new Map()

// ========================================
// COMMANDS PATH
// ========================================

const commandsPath = path.join(
    __dirname,
    '../commands'
)

// ========================================
// CREATE COMMANDS FOLDER
// ========================================

try {

    if (!fs.existsSync(commandsPath)) {

        fs.mkdirSync(
            commandsPath,
            {
                recursive: true
            }
        )
    }

} catch (err) {

    console.log(
        '❌ COMMAND FOLDER ERROR:'
    )

    console.log(err)
}

// ========================================
// LOAD COMMANDS
// ========================================

function loadCommands() {

    try {

        commands.clear()

        const files = fs
            .readdirSync(commandsPath)
            .filter(file =>
                file.endsWith('.js')
            )

        for (const file of files) {

            try {

                const filePath =
                    path.join(
                        commandsPath,
                        file
                    )

                delete require.cache[
                    require.resolve(filePath)
                ]

                const command =
                    require(filePath)

                // ========================================
                // VALIDATION
                // ========================================

                if (!command) continue

                if (
                    typeof command !==
                    'object'
                ) continue

                if (
                    !command.name
                ) continue

                if (
                    typeof command.execute !==
                    'function'
                ) continue

                const name =
                    command.name.toLowerCase()

                commands.set(
                    name,
                    command
                )

                // ========================================
                // ALIASES
                // ========================================

                if (
                    Array.isArray(
                        command.aliases
                    )
                ) {

                    for (const alias of command.aliases) {

                        if (
                            typeof alias ===
                            'string'
                        ) {

                            commands.set(
                                alias.toLowerCase(),
                                command
                            )
                        }
                    }
                }

                console.log(
                    `✅ LOADED: ${name}`
                )

            } catch (err) {

                console.log(
                    `❌ FAILED: ${file}`
                )

                console.log(err)
            }
        }

        console.log(
            `📦 TOTAL COMMANDS: ${commands.size}`
        )

    } catch (err) {

        console.log(
            '❌ LOAD COMMANDS ERROR'
        )

        console.log(err)
    }
}

// ========================================
// INITIAL LOAD
// ========================================

loadCommands()

// ========================================
// GET BODY
// ========================================

function getBody(msg) {

    try {

        const message =
            msg.message || {}

        return (

            message.conversation ||

            message.extendedTextMessage
                ?.text ||

            message.imageMessage
                ?.caption ||

            message.videoMessage
                ?.caption ||

            message.buttonsResponseMessage
                ?.selectedButtonId ||

            message.listResponseMessage
                ?.singleSelectReply
                ?.selectedRowId ||

            message.templateButtonReplyMessage
                ?.selectedId ||

            ''
        )

    } catch {

        return ''
    }
}

// ========================================
// HANDLE COMMAND
// ========================================

async function handleCommand(
    sock,
    msg
) {

    try {

        if (
            !sock ||
            !msg ||
            !msg.message
        ) return

        const from =
            msg.key?.remoteJid

        if (!from) return

        if (
            from ===
            'status@broadcast'
        ) return

        const body =
            getBody(msg)

        if (!body) return

        // ========================================
        // PREFIX
        // ========================================

        const prefix =
            settings.prefix || '.'

        if (
            !body.startsWith(prefix)
        ) return

        // ========================================
        // PARSE
        // ========================================

        const args =
            body
            .slice(prefix.length)
            .trim()
            .split(/\s+/)

        const commandName =
            args.shift()
            ?.toLowerCase()

        if (!commandName) return

        console.log(
            `📥 ${commandName}`
        )

        // ========================================
        // COMMAND
        // ========================================

        const command =
            commands.get(commandName)

        if (!command) {

            console.log(
                `❌ UNKNOWN: ${commandName}`
            )

            return
        }

        // ========================================
        // GROUP
        // ========================================

        const isGroup =
            from.endsWith('@g.us')

        const sender =
            isGroup
                ? (
                    msg.key?.participant ||
                    ''
                  )
                : from

        const normalizedSender =
            sender.includes(':')
                ? sender.split(':')[0] +
                  '@s.whatsapp.net'
                : sender

        // ========================================
        // DATABASE
        // ========================================

        let userData = {}
        let groupData = {}

        try {

            userData =
                getUser(
                    normalizedSender
                ) || {}

            if (isGroup) {

                groupData =
                    getGroup(from) || {}
            }

        } catch {}

        // ========================================
        // OWNER ONLY
        // ========================================

        if (
            command.owner === true &&
            normalizedSender !==
            `${settings.ownerNumber}@s.whatsapp.net`
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '❌ Owner only command.'
                },
                {
                    quoted: msg
                }
            )
        }

        // ========================================
        // GROUP ONLY
        // ========================================

        if (
            command.group === true &&
            !isGroup
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '❌ Group only command.'
                },
                {
                    quoted: msg
                }
            )
        }

        // ========================================
        // EXECUTE
        // ========================================

        try {

            await command.execute(
                sock,
                msg,
                args,
                {
                    from,
                    sender:
                        normalizedSender,
                    isGroup,
                    userData,
                    groupData,
                    prefix
                }
            )

            console.log(
                `✅ SUCCESS: ${commandName}`
            )

        } catch (cmdError) {

            console.log(
                `❌ EXECUTE ERROR: ${commandName}`
            )

            console.log(cmdError)

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
                            '❌ Command failed.'
                    },
                    {
                        quoted: msg
                    }
                )

            } catch {}
        }

    } catch (err) {

        console.log(
            '❌ HANDLE COMMAND ERROR'
        )

        console.log(err)
    }
}

// ========================================
// EXPORTS
// ========================================

module.exports = {

    handleCommand,

    reloadCommands:
        loadCommands,

    commands
}
