const fs = require('fs')
const path = require('path')

const dbFolder = path.join(
    __dirname,
    '../database'
)

const dbPath = path.join(
    dbFolder,
    'database.json'
)

const badWords = [
    'fuck',
    'shit',
    'bitch',
    'asshole',
    'idiot',
    'stupid',
    'bastard'
]

module.exports = {
    name: 'antibadword',

    async execute(sock, msg, args) {

        const from =
            msg?.key?.remoteJid || null

        try {

            if (
                !sock ||
                typeof sock !== 'object'
            ) {
                return
            }

            if (
                typeof sock.sendMessage !==
                    'function' ||
                typeof sock.groupMetadata !==
                    'function'
            ) {
                return
            }

            if (
                !from ||
                typeof from !== 'string'
            ) {
                return
            }

            if (
                !from.endsWith('@g.us')
            ) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ANTIBADWORD COMMAND 〕━━⬣
┃
┃ This command only
┃ works in groups.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const sender =
                msg?.key?.participant ||
                msg?.participant ||
                null

            if (
                !sender ||
                typeof sender !== 'string'
            ) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Unable to detect
┃ command sender.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            let metadata = null

            try {

                metadata =
                    await sock.groupMetadata(
                        from
                    )

            } catch (metadataError) {

                console.log(
                    'Metadata Error:',
                    metadataError
                )

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to fetch
┃ group metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                !metadata ||
                !Array.isArray(
                    metadata.participants
                )
            ) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Invalid group
┃ metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const participants =
                metadata.participants

            const admins =
                participants
                    .filter(
                        member =>
                            member &&
                            member.admin
                    )
                    .map(
                        member =>
                            member.id
                    )

            const rawBotId =
                sock?.user?.id || ''

            const botNumber =
                rawBotId
                    .split(':')[0]
                    ?.trim() +
                '@s.whatsapp.net'

            const normalizedSender =
                sender.includes(':')
                    ? sender.split(':')[0] +
                      '@s.whatsapp.net'
                    : sender

            const isSenderAdmin =
                admins.includes(
                    normalizedSender
                )

            const isBotAdmin =
                admins.includes(
                    botNumber
                )

            if (!isSenderAdmin) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ACCESS DENIED 〕━━⬣
┃
┃ Only group admins
┃ can use this command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (!isBotAdmin) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ BOT NOT ADMIN 〕━━⬣
┃
┃ Bot must be admin
┃ to manage protection.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            const option =
                args[0]
                    ?.trim()
                    ?.toLowerCase() || ''

            const mode =
                args[1]
                    ?.trim()
                    ?.toLowerCase() || ''

            if (
                !fs.existsSync(
                    dbFolder
                )
            ) {

                fs.mkdirSync(
                    dbFolder,
                    {
                        recursive: true
                    }
                )
            }

            let db = {}

            if (
                fs.existsSync(
                    dbPath
                )
            ) {

                try {

                    db = JSON.parse(
                        fs.readFileSync(
                            dbPath,
                            'utf8'
                        )
                    )

                } catch {

                    db = {}
                }
            }

            if (
                typeof db !== 'object' ||
                db === null
            ) {

                db = {}
            }

            if (
                typeof db.antibadword !==
                    'object' ||
                db.antibadword === null
            ) {

                db.antibadword = {}
            }

            if (!option) {

                const status =
                    db.antibadword[from]
                        ?.enabled === true
                        ? 'ON'
                        : 'OFF'

                const currentMode =
                    db.antibadword[from]
                        ?.mode || 'delete'

                return sock.sendMessage(from, {
                    text:
`╭━━〔 🛡️ ANTIBADWORD SETTINGS 〕━━⬣
┃
┃ Status: ${status}
┃ Mode: ${currentMode.toUpperCase()}
┃
┃ Available Modes:
┃ • delete
┃ • warn
┃ • remove
┃
┃ Usage:
┃ .antibadword on delete
┃ .antibadword on warn
┃ .antibadword on remove
┃ .antibadword off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const validOptions = [
                'on',
                'off'
            ]

            if (
                !validOptions.includes(
                    option
                )
            ) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ INVALID OPTION 〕━━⬣
┃
┃ Use:
┃ .antibadword on
┃ .antibadword off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'on') {

                const validModes = [
                    'delete',
                    'warn',
                    'remove'
                ]

                if (
                    !validModes.includes(
                        mode
                    )
                ) {

                    return sock.sendMessage(from, {
                        text:
`╭━━〔 ❌ INVALID MODE 〕━━⬣
┃
┃ Available Modes:
┃ • delete
┃ • warn
┃ • remove
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }

                db.antibadword[from] = {
                    enabled: true,
                    mode
                }

                fs.writeFileSync(
                    dbPath,
                    JSON.stringify(
                        db,
                        null,
                        2
                    )
                )

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ✅ ANTIBADWORD ENABLED 〕━━⬣
┃
┃ Protection has been
┃ enabled successfully.
┃
┃ Mode:
┃ ${mode.toUpperCase()}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'off') {

                db.antibadword[from] = {
                    enabled: false,
                    mode: null
                }

                fs.writeFileSync(
                    dbPath,
                    JSON.stringify(
                        db,
                        null,
                        2
                    )
                )

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ✅ ANTIBADWORD DISABLED 〕━━⬣
┃
┃ Badword protection
┃ has been disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

        } catch (error) {

            console.log(
                'AntiBadWord Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ antibadword command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    },

    async handle(sock, msg) {

        try {

            if (
                !sock ||
                typeof sock !== 'object'
            ) {
                return
            }

            const from =
                msg?.key?.remoteJid || null

            if (
                !from ||
                typeof from !== 'string'
            ) {
                return
            }

            if (
                !from.endsWith('@g.us')
            ) {
                return
            }

            if (
                !fs.existsSync(
                    dbPath
                )
            ) {
                return
            }

            let db = {}

            try {

                db = JSON.parse(
                    fs.readFileSync(
                        dbPath,
                        'utf8'
                    )
                )

            } catch {

                return
            }

            const settings =
                db?.antibadword?.[
                    from
                ]

            if (
                !settings ||
                settings.enabled !== true
            ) {
                return
            }

            const sender =
                msg?.key?.participant ||
                msg?.participant ||
                null

            if (
                !sender ||
                typeof sender !== 'string'
            ) {
                return
            }

            const text =
                msg?.message
                    ?.conversation ||
                msg?.message
                    ?.extendedTextMessage
                    ?.text ||
                ''

            if (
                !text ||
                typeof text !== 'string'
            ) {
                return
            }

            const lowerText =
                text.toLowerCase()

            const detected =
                badWords.some(
                    word =>
                        lowerText.includes(
                            word
                        )
                )

            if (!detected) {
                return
            }

            const mode =
                settings.mode || 'delete'

            if (mode === 'warn') {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ⚠️ WARNING 〕━━⬣
┃
┃ @${sender.split('@')[0]}
┃
┃ Bad words are not
┃ allowed in this group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`,
                    mentions: [sender]
                })
            }

            if (mode === 'delete') {

                return sock.sendMessage(from, {
                    delete: msg.key
                })
            }

            if (mode === 'remove') {

                let metadata = null

                try {

                    metadata =
                        await sock.groupMetadata(
                            from
                        )

                } catch {
                    return
                }

                if (
                    !metadata ||
                    !Array.isArray(
                        metadata.participants
                    )
                ) {
                    return
                }

                const admins =
                    metadata.participants
                        .filter(
                            member =>
                                member &&
                                member.admin
                        )
                        .map(
                            member =>
                                member.id
                        )

                const rawBotId =
                    sock?.user?.id || ''

                const botNumber =
                    rawBotId
                        .split(':')[0]
                        ?.trim() +
                    '@s.whatsapp.net'

                const isBotAdmin =
                    admins.includes(
                        botNumber
                    )

                if (!isBotAdmin) {
                    return
                }

                await sock.groupParticipantsUpdate(
                    from,
                    [sender],
                    'remove'
                )

                return sock.sendMessage(from, {
                    text:
`╭━━〔 🚫 USER REMOVED 〕━━⬣
┃
┃ @${sender.split('@')[0]}
┃ removed for using
┃ bad words.
┃
╰━━━━━━━━━━━━━━━━━━⬣`,
                    mentions: [sender]
                })
            }

        } catch (error) {

            console.log(
                'AntiBadWord Handler Error:',
                error
            )
        }
    }
}