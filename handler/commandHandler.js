const fs = require('fs')
const path = require('path')

const settings = require('../settings')

const {
    getUser,
    getGroup
} = require('../database/database')

//========================================
// STORAGE
//========================================

const commands = new Map()

//========================================
// COMMAND PATH
//========================================

const commandsPath = path.join(
    __dirname,
    '../commands'
)

//========================================
// CREATE COMMANDS FOLDER
//========================================

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

//========================================
// LOAD COMMANDS
//========================================

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

                const filePath = path.join(
                    commandsPath,
                    file
                )

                //========================================
                // CLEAR CACHE
                //========================================

                delete require.cache[
                    require.resolve(filePath)
                ]

                const command =
                    require(filePath)

                //========================================
                // VALIDATION
                //========================================

                if (
                    !command ||
                    typeof command !== 'object'
                ) {

                    console.log(
                        `❌ INVALID COMMAND: ${file}`
                    )

                    continue
                }

                if (
                    !command.name ||
                    typeof command.name !== 'string'
                ) {

                    console.log(
                        `❌ MISSING NAME: ${file}`
                    )

                    continue
                }

                if (
                    typeof command.execute !==
                    'function'
                ) {

                    console.log(
                        `❌ MISSING EXECUTE: ${file}`
                    )

                    continue
                }

                const name =
                    command.name.toLowerCase()

                commands.set(
                    name,
                    command
                )

                //========================================
                // LOAD ALIASES
                //========================================

                if (
                    Array.isArray(
                        command.aliases
                    )
                ) {

                    for (const alias of command.aliases) {

                        if (
                            typeof alias === 'string'
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
                    `❌ FAILED LOADING: ${file}`
                )

                console.log(err)
            }
        }

        console.log(
            `📦 TOTAL COMMANDS: ${commands.size}`
        )

    } catch (err) {

        console.log(
            '❌ LOAD COMMANDS ERROR:'
        )

        console.log(err)
    }
}

//========================================
// INITIAL LOAD
//========================================

loadCommands()

//========================================
// GET MESSAGE BODY
//========================================

function getBody(msg) {

    try {

        const message =
            msg.message || {}

        const msgType =
            Object.keys(message)[0]

        const content =
            message[msgType] || {}

        return (

            message.conversation ||

            message.extendedTextMessage?.text ||

            message.imageMessage?.caption ||

            message.videoMessage?.caption ||

            message.buttonsResponseMessage
                ?.selectedButtonId ||

            message.listResponseMessage
                ?.singleSelectReply
                ?.selectedRowId ||

            message.templateButtonReplyMessage
                ?.selectedId ||

            content.text ||

            content.caption ||

            content.selectedButtonId ||

            content.singleSelectReply
                ?.selectedRowId ||

            ''
        )

    } catch {

        return ''
    }
}

//========================================
// HANDLE COMMAND
//========================================

async function handleCommand(
    sock,
    msg
) {

    try {

        //========================================
        // SAFE CHECKS
        //========================================

        if (
            !sock ||
            !msg ||
            !msg.message
        ) {
            return
        }

        const from =
            msg.key?.remoteJid

        if (!from) {
            return
        }

        //========================================
        // IGNORE STATUS
        //========================================

        if (
            from ===
            'status@broadcast'
        ) {
            return
        }

        //========================================
        // SELF COMMANDS
        //========================================

        if (
            msg.key?.fromMe &&
            settings.selfCommands !== true
        ) {
            return
        }

        const isGroup =
            from.endsWith('@g.us')

        const sender = isGroup
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

        //========================================
        // MESSAGE BODY
        //========================================

        const body =
            getBody(msg)

        if (
            !body ||
            typeof body !== 'string'
        ) {
            return
        }

        //========================================
        // RUN REPLY HANDLERS
        //========================================

        for (const cmd of commands.values()) {

            try {

                if (
                    typeof cmd.replyHandler ===
                    'function'
                ) {

                    await cmd.replyHandler(
                        sock,
                        msg
                    )
                }

            } catch (err) {

                console.log(
                    `❌ REPLY HANDLER ERROR (${cmd.name})`
                )

                console.log(err)
            }
        }

        //========================================
        // PREFIX
        //========================================

        const prefix =
            settings.prefix || '.'

        if (
            !body.startsWith(prefix)
        ) {
            return
        }

        //========================================
        // COMMAND PARSE
        //========================================

        const args = body
            .slice(prefix.length)
            .trim()
            .split(/\s+/)

        const commandName =
            args.shift()?.toLowerCase()

        if (!commandName) {
            return
        }

        const command =
            commands.get(commandName)

        //========================================
        // COMMAND NOT FOUND
        //========================================

        if (!command) {

            console.log(
                `❌ UNKNOWN COMMAND: ${commandName}`
            )

            return await sock.sendMessage(
                from,
                {
                    text:
                        '❌ Command not found.'
                },
                {
                    quoted: msg
                }
            )
        }

        //========================================
        // DATABASE SAFE
        //========================================

        let userData = {}
        let groupData = {}

        try {

            userData =
                getUser(normalizedSender) || {}

            if (isGroup) {

                groupData =
                    getGroup(from) || {}
            }

        } catch (dbError) {

            console.log(
                '❌ DATABASE ERROR:'
            )

            console.log(dbError)
        }

        //========================================
        // MAINTENANCE
        //========================================

        if (
            settings.maintenance === true &&
            normalizedSender !==
            `${settings.ownerNumber}@s.whatsapp.net`
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '🚧 Bot under maintenance.'
                },
                {
                    quoted: msg
                }
            )
        }

        //========================================
        // OWNER ONLY
        //========================================

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

        //========================================
        // GROUP ONLY
        //========================================

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

        //========================================
        // PRIVATE ONLY
        //========================================

        if (
            command.private === true &&
            isGroup
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '❌ Private only command.'
                },
                {
                    quoted: msg
                }
            )
        }

        //========================================
        // BANNED USER
        //========================================

        if (
            userData?.banned === true
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '❌ You are banned.'
                },
                {
                    quoted: msg
                }
            )
        }

        //========================================
        // LOG COMMAND
        //========================================

        console.log(
            `▶ RUNNING COMMAND: ${commandName}`
        )

        //========================================
        // EXECUTE COMMAND
        //========================================

        await command.execute(
            sock,
            msg,
            args,
            {
                userData,
                groupData,
                isGroup,
                sender:
                    normalizedSender,
                prefix
            }
        )

    } catch (err) {

        console.log(
            '❌ COMMAND HANDLER ERROR:'
        )

        console.log(err)
    }
}

//========================================
// EXPORTS
//========================================

module.exports = {

    handleCommand,

    reloadCommands:
        loadCommands,

    commands
}
