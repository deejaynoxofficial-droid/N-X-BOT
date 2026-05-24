const fs = require('fs')
const path = require('path')

const settings =
    require('../settings')

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
// CREATE FOLDER
//========================================

if (
    !fs.existsSync(commandsPath)
) {

    fs.mkdirSync(
        commandsPath,
        {
            recursive: true
        }
    )
}

//========================================
// LOAD COMMANDS
//========================================

function loadCommands() {

    commands.clear()

    const files =
        fs.readdirSync(commandsPath)
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

            if (
                !command ||
                typeof command !== 'object'
            ) {
                continue
            }

            if (
                !command.name ||
                typeof command.execute !==
                'function'
            ) {
                continue
            }

            const name =
                command.name.toLowerCase()

            commands.set(
                name,
                command
            )

            // aliases
            if (
                Array.isArray(
                    command.aliases
                )
            ) {

                for (const alias of command.aliases) {

                    commands.set(
                        alias.toLowerCase(),
                        command
                    )
                }
            }

            console.log(
                `✅ Loaded Command: ${name}`
            )

        } catch (err) {

            console.log(
                `❌ Failed Loading: ${file}`
            )

            console.log(err)
        }
    }

    console.log(
        `📦 TOTAL COMMANDS: ${commands.size}`
    )
}

//========================================
// INITIAL LOAD
//========================================

loadCommands()

//========================================
// GET MESSAGE TEXT
//========================================

function getBody(msg) {

    try {

        const message =
            msg.message

        const msgType =
            Object.keys(message || {})[0]

        const content =
            message?.[msgType]

        return (

            message?.conversation ||

            message?.extendedTextMessage?.text ||

            content?.text ||

            content?.caption ||

            content?.selectedButtonId ||

            content?.singleSelectReply
                ?.selectedRowId ||

            message?.buttonsResponseMessage
                ?.selectedButtonId ||

            message?.listResponseMessage
                ?.singleSelectReply
                ?.selectedRowId ||

            message?.templateButtonReplyMessage
                ?.selectedId ||

            message?.interactiveResponseMessage
                ?.body?.text ||

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

        if (
            msg.key?.fromMe &&
            settings.selfCommands !== true
        ) {
            return
        }

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

        //========================================
        // GET TEXT
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
        // REPLY HANDLERS
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
                    `❌ ReplyHandler Error (${cmd.name})`
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

        const args =
            body
                .slice(prefix.length)
                .trim()
                .split(/\s+/)

        const commandName =
            args.shift()
                ?.toLowerCase()

        if (!commandName) {
            return
        }

        const command =
            commands.get(commandName)

        if (!command) {

            console.log(
                `❌ Unknown Command: ${commandName}`
            )

            return
        }

        //========================================
        // DATABASE
        //========================================

        const userData =
            getUser(normalizedSender)

        const groupData =
            isGroup
                ? getGroup(from)
                : null

        //========================================
        // BANNED
        //========================================

        if (
            userData?.banned
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '❌ You are banned.'
                }
            )
        }

        //========================================
        // MAINTENANCE
        //========================================

        if (
            settings.maintenance &&
            normalizedSender !==
            `${settings.ownerNumber}@s.whatsapp.net`
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '🚧 Bot under maintenance.'
                }
            )
        }

        //========================================
        // OWNER ONLY
        //========================================

        if (
            command.owner &&
            normalizedSender !==
            `${settings.ownerNumber}@s.whatsapp.net`
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '❌ Owner only command.'
                }
            )
        }

        //========================================
        // GROUP ONLY
        //========================================

        if (
            command.group &&
            !isGroup
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '❌ Group only command.'
                }
            )
        }

        //========================================
        // PRIVATE ONLY
        //========================================

        if (
            command.private &&
            isGroup
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '❌ Private only command.'
                }
            )
        }

        //========================================
        // EXECUTE
        //========================================

        console.log(
            `▶ RUNNING: ${commandName}`
        )

        await Promise.resolve(

            command.execute(
                sock,
                msg,
                args,
                {
                    userData,
                    groupData,
                    isGroup,
                    sender:
                        normalizedSender
                }
            )
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
