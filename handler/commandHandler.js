const fs = require('fs')

const path = require('path')

const settings = require('../settings')

const {
    getUser,
    getGroup
} = require('../database/database')

//========================================
// COMMAND STORAGE
//========================================

const commands = new Map()

//========================================
// LOAD COMMANDS
//========================================

const commandsPath =

    path.join(
        __dirname,
        '../commands'
    )

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

const commandFiles =

    fs.readdirSync(commandsPath)

        .filter(
            file =>
                file.endsWith('.js')
        )

for (const file of commandFiles) {

    try {

        const command =

            require(
                `../commands/${file}`
            )

        if (
            !command ||
            typeof command !== 'object'
        ) {

            console.log(
                `INVALID COMMAND: ${file}`
            )

            continue
        }

        if (
            typeof command.name !==
            'string'
        ) {

            console.log(
                `MISSING NAME: ${file}`
            )

            continue
        }

        if (
            typeof command.execute !==
            'function'
        ) {

            console.log(
                `MISSING EXECUTE: ${file}`
            )

            continue
        }

        commands.set(
            command.name.toLowerCase(),
            command
        )

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
            `LOADED COMMAND: ${command.name}`
        )

    } catch (loadError) {

        console.log(
            `FAILED TO LOAD: ${file}`
        )

        console.log(loadError)
    }
}

//========================================
// TOTAL COMMANDS
//========================================

console.log(
    `TOTAL COMMANDS LOADED: ${commands.size}`
)

//========================================
// HANDLE COMMANDS
//========================================

async function handleCommand(
    sock,
    msg
) {

    try {

        if (
            !sock ||
            typeof sock.sendMessage !==
            'function'
        ) {
            return
        }

        if (
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

        const isGroup =
            from.endsWith('@g.us')

        const sender =

            isGroup

                ? (
                    msg.key?.participant ||
                    msg.participant ||
                    ''
                  )

                : from

        if (!sender) {
            return
        }

        const normalizedSender =

            sender.includes(':')

                ? sender.split(':')[0] +
                  '@s.whatsapp.net'

                : sender

        //========================================
        // MESSAGE BODY
        //========================================

        const message =
            msg.message || {}

        const body =

            message?.conversation ||

            message?.extendedTextMessage
                ?.text ||

            message?.imageMessage
                ?.caption ||

            message?.videoMessage
                ?.caption ||

            message?.buttonsResponseMessage
                ?.selectedButtonId ||

            message?.listResponseMessage
                ?.singleSelectReply
                ?.selectedRowId ||

            message?.templateButtonReplyMessage
                ?.selectedId ||

            message?.interactiveResponseMessage
                ?.body?.text ||

            message?.interactiveResponseMessage
                ?.nativeFlowResponseMessage
                ?.paramsJson ||

            message?.documentMessage
                ?.caption ||

            message?.documentWithCaptionMessage
                ?.message
                ?.documentMessage
                ?.caption ||

            ''

        //========================================
        // INVALID BODY
        //========================================

        if (
            typeof body !== 'string'
        ) {
            return
        }

        const cleanBody =
            body.trim()

        if (
            !cleanBody.startsWith(
                settings.prefix
            )
        ) {
            return
        }

        //========================================
        // PARSE COMMAND
        //========================================

        const args =

            cleanBody
                .slice(
                    settings.prefix.length
                )
                .trim()
                .split(/ +/)

        const commandName =

            args.shift()
                ?.toLowerCase() || ''

        if (!commandName) {
            return
        }

        const command =
            commands.get(commandName)

        if (!command) {

            console.log(
                `COMMAND NOT FOUND: ${commandName}`
            )

            return
        }

        //========================================
        // DATABASE
        //========================================

        const userData =
            getUser(
                normalizedSender
            )

        const groupData =

            isGroup
                ? getGroup(from)
                : null

        //========================================
        // BANNED
        //========================================

        if (
            userData?.banned === true
        ) {

            return await sock.sendMessage(
                from,
                {
                    text:
                        '❌ You are banned from using the bot.'
                }
            )
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
                        '🚧 Bot is under maintenance.'
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
                }
            )
        }

        //========================================
        // REACTION
        //========================================

        if (
            settings.reactEmoji
        ) {

            try {

                await sock.sendMessage(
                    from,
                    {
                        react: {
                            text:
                                settings.reactEmoji,
                            key: msg.key
                        }
                    }
                )

            } catch {}
        }

        //========================================
        // EXECUTE
        //========================================

        console.log(
            `EXECUTING: ${commandName}`
        )

        await command.execute(
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

    } catch (error) {

        console.log(
            'HANDLE COMMAND ERROR:'
        )

        console.log(error)
    }
}

//========================================
// EXPORTS
//========================================

module.exports = {

    handleCommand,

    commands
}
