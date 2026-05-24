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
// COOLDOWN STORAGE
//========================================

const cooldowns = new Map()

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

        //========================================
        // ALIASES
        //========================================

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

        //========================================
        // SOCKET CHECK
        //========================================

        if (
            !sock ||
            typeof sock.sendMessage !==
            'function'
        ) {
            return
        }

        //========================================
        // MESSAGE CHECK
        //========================================

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

        //========================================
        // GROUP CHECK
        //========================================

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

        //========================================
        // NORMALIZE SENDER
        //========================================

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

            ''

        if (
            !body ||
            typeof body !== 'string'
        ) {
            return
        }

        //========================================
        // MULTI PREFIX SUPPORT
        //========================================

        let usedPrefix = null

        const prefixes =

            settings.multiPrefix
                ? settings.prefixes
                : [settings.prefix]

        for (const prefix of prefixes) {

            if (
                body.startsWith(prefix)
            ) {

                usedPrefix = prefix

                break
            }
        }

        if (!usedPrefix) {
            return
        }

        //========================================
        // PARSE COMMAND
        //========================================

        const args =

            body
                .slice(
                    usedPrefix.length
                )
                .trim()
                .split(/ +/)

        const commandName =

            args.shift()
                ?.toLowerCase() || ''

        if (!commandName) {
            return
        }

        //========================================
        // GET COMMAND
        //========================================

        const command =
            commands.get(commandName)

        if (!command) {

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
        // OWNER CHECK
        //========================================

        const ownerNumbers = [

            settings.ownerNumber,

            ...(settings.ownerNumbers || [])
        ]

        const isOwner =
            ownerNumbers.some(
                num =>
                    normalizedSender ===
                    `${num}@s.whatsapp.net`
            )

        //========================================
        // PUBLIC / SELF MODE
        //========================================

        if (
            settings.publicMode === false &&
            !isOwner
        ) {

            return
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
                        '❌ You are banned from using the bot.'
                }
            )
        }

        //========================================
        // MAINTENANCE
        //========================================

        if (
            settings.maintenance === true &&
            !isOwner
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
            !isOwner
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
        // GROUP MUTE
        //========================================

        if (
            isGroup &&
            groupData?.mute === true &&
            !isOwner
        ) {

            return
        }

        //========================================
        // COOLDOWN SYSTEM
        //========================================

        if (
            settings.enableCooldown &&
            !isOwner
        ) {

            const cooldownKey =
                `${normalizedSender}_${commandName}`

            const cooldown =
                cooldowns.get(cooldownKey)

            const now =
                Date.now()

            const cooldownTime =
                (
                    settings.cooldown || 3
                ) * 1000

            if (
                cooldown &&
                now - cooldown < cooldownTime
            ) {

                const remaining =

                    (
                        cooldownTime -
                        (now - cooldown)
                    ) / 1000

                return await sock.sendMessage(
                    from,
                    {
                        text:
`⏳ Please wait ${remaining.toFixed(1)} seconds before using this command again.`
                    }
                )
            }

            cooldowns.set(
                cooldownKey,
                now
            )

            setTimeout(() => {

                cooldowns.delete(
                    cooldownKey
                )

            }, cooldownTime)
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
        // EXECUTE COMMAND
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
                    normalizedSender,
                isOwner,
                prefix:
                    usedPrefix
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
