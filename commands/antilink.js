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

module.exports = {
    name: 'antilink',

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
`╭━━〔 ❌ ANTILINK COMMAND 〕━━⬣
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

            const isSenderAdmin =
                admins.includes(sender)

            const isBotAdmin =
                admins.includes(botNumber)

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
┃ to manage antilink.
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
                typeof db.antilink !==
                    'object' ||
                db.antilink === null
            ) {

                db.antilink = {}
            }

            if (!option) {

                const status =
                    db.antilink[from]
                        ?.enabled === true
                        ? 'ON'
                        : 'OFF'

                const currentMode =
                    db.antilink[from]
                        ?.mode || 'delete'

                return sock.sendMessage(from, {
                    text:
`╭━━〔 🔗 ANTILINK SETTINGS 〕━━⬣
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
┃ .antilink on delete
┃ .antilink on warn
┃ .antilink on remove
┃ .antilink off
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
┃ .antilink on
┃ .antilink off
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

                db.antilink[from] = {
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
`╭━━〔 ✅ ANTILINK ENABLED 〕━━⬣
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

                db.antilink[from] = {
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
`╭━━〔 ✅ ANTILINK DISABLED 〕━━⬣
┃
┃ Link protection has
┃ been disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

        } catch (error) {

            console.log(
                'AntiLink Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ antilink command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}