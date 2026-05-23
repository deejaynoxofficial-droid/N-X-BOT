const fs = require('fs')
const path = require('path')

const settings = require('../settings')

const {
    getUser,
    getGroup
} = require('./database')

const commands = new Map()

// LOAD COMMANDS
const commandsPath =
    path.join(
        __dirname,
        '../commands'
    )

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
            typeof command !==
                'object'
        ) {
            continue
        }

        if (
            typeof command.name !==
            'string'
        ) {
            continue
        }

        commands.set(
            command.name.toLowerCase(),
            command
        )

        // LOAD ALIASES
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

    } catch (loadError) {

        console.log(
            `Failed to load command: ${file}`,
            loadError
        )
    }
}

// HANDLE COMMANDS
async function handleCommand(
    sock,
    msg
) {

    try {

        if (
            !sock ||
            typeof sock !==
                'object'
        ) {
            return
        }

        if (
            typeof sock.sendMessage !==
            'function'
        ) {
            return
        }

        if (
            !msg ||
            typeof msg !==
                'object'
        ) {
            return
        }

        const from =
            msg?.key?.remoteJid ||
            null

        if (
            !from ||
            typeof from !==
                'string'
        ) {
            return
        }

        const isGroup =
            from.endsWith('@g.us')

        const sender =
            isGroup
                ? (
                    msg?.key
                        ?.participant ||
                    msg?.participant ||
                    ''
                )
                : from

        if (
            !sender ||
            typeof sender !==
                'string'
        ) {
            return
        }

        const normalizedSender =
            sender.includes(':')
                ? sender.split(':')[0] +
                  '@s.whatsapp.net'
                : sender

        const message =
            msg?.message || {}

        const body =
            message?.conversation ||
            message
                ?.extendedTextMessage
                ?.text ||
            message
                ?.imageMessage
                ?.caption ||
            message
                ?.videoMessage
                ?.caption ||
            ''

        if (
            !body ||
            typeof body !==
                'string'
        ) {
            return
        }

        // PREFIX CHECK
        if (
            !body.startsWith(
                settings.prefix
            )
        ) {
            return
        }

        // PARSE COMMAND
        const args =
            body
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
            commands.get(
                commandName
            )

        if (
            !command ||
            typeof command.execute !==
                'function'
        ) {
            return
        }

        // DATABASE
        const userData =
            getUser(
                normalizedSender
            )

        const groupData =
            isGroup
                ? getGroup(from)
                : null

        // BANNED USER
        if (
            userData?.banned ===
            true
        ) {

            return sock.sendMessage(
                from,
                {
                    text:
                        '❌ You are banned from using the bot.'
                }
            )
        }

        // MAINTENANCE MODE
        if (
            settings.maintenance ===
                true &&
            normalizedSender !==
                `${settings.ownerNumber}@s.whatsapp.net`
        ) {

            return sock.sendMessage(
                from,
                {
                    text:
                        '🚧 Bot is currently under maintenance.'
                }
            )
        }

        // OWNER ONLY
        if (
            command.owner ===
                true &&
            normalizedSender !==
                `${settings.ownerNumber}@s.whatsapp.net`
        ) {

            return sock.sendMessage(
                from,
                {
                    text:
                        '❌ This command is owner only.'
                }
            )
        }

        // GROUP ONLY
        if (
            command.group ===
                true &&
            !isGroup
        ) {

            return sock.sendMessage(
                from,
                {
                    text:
                        '❌ This command only works in groups.'
                }
            )
        }

        // PRIVATE ONLY
        if (
            command.private ===
                true &&
            isGroup
        ) {

            return sock.sendMessage(
                from,
                {
                    text:
                        '❌ This command only works in private chat.'
                }
            )
        }

        // REACT
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

        // EXECUTE
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
            'Handle Command Error:',
            error
        )
    }
}

module.exports = {
    handleCommand,
    commands
}