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

// CREATE COMMAND FOLDER IF MISSING

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

// READ COMMAND FILES

const commandFiles =

    fs.readdirSync(commandsPath)

        .filter(
            file =>
                file.endsWith('.js')
        )

// LOAD EACH COMMAND

for (const file of commandFiles) {

    try {

        const command =

            require(
                `../commands/${file}`
            )

        // VALIDATE COMMAND

        if (
            !command ||
            typeof command !== 'object'
        ) {

            console.log(
                `INVALID COMMAND: ${file}`
            )

            continue
        }

        // CHECK NAME

        if (
            typeof command.name !==
            'string'
        ) {

            console.log(
                `MISSING NAME: ${file}`
            )

            continue
        }

        // CHECK EXECUTE

        if (
            typeof command.execute !==
            'function'
        ) {

            console.log(
                `MISSING EXECUTE: ${file}`
            )

            continue
        }

        // SAVE COMMAND

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
        // MESSAGE BODY FIX
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

        //========================================
        // EMPTY BODY
        //========================================

        if (
            !body ||
            typeof body !== 'string'
        ) {
            return
        }

        //========================================
        // PREFIX CHECK
        //========================================

        if (
            !body.startsWith(
                settings.prefix
            )
        ) {
            return
        }

        //========================================
        // PARSE COMMAND
        //========================================

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

        //========================================
        // GET COMMAND
        //========================================

        const command =
            commands.get(commandName)

        //========================================
        // COMMAND NOT FOUND
        //========================================

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
