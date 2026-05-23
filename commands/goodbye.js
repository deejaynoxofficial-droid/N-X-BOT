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
    name: 'goodbye',

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
`╭━━〔 ❌ GOODBYE COMMAND 〕━━⬣
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
┃ to manage goodbye.
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
                typeof db.goodbye !==
                    'object' ||
                db.goodbye === null
            ) {

                db.goodbye = {}
            }

            if (!option) {

                const status =
                    db.goodbye[from] === true
                        ? 'ON'
                        : 'OFF'

                return sock.sendMessage(from, {
                    text:
`╭━━〔 👋 GOODBYE SETTINGS 〕━━⬣
┃
┃ Current Status: ${status}
┃
┃ Usage:
┃ .goodbye on
┃ .goodbye off
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
┃ .goodbye on
┃ .goodbye off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'on') {

                if (
                    db.goodbye[from] ===
                    true
                ) {

                    return sock.sendMessage(from, {
                        text:
`╭━━〔 ⚠️ ALREADY ENABLED 〕━━⬣
┃
┃ Goodbye messages are
┃ already enabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }

                db.goodbye[from] = true

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
`╭━━〔 ✅ GOODBYE ENABLED 〕━━⬣
┃
┃ Goodbye messages
┃ have been enabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'off') {

                if (
                    db.goodbye[from] ===
                    false
                ) {

                    return sock.sendMessage(from, {
                        text:
`╭━━〔 ⚠️ ALREADY DISABLED 〕━━⬣
┃
┃ Goodbye messages are
┃ already disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }

                db.goodbye[from] = false

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
`╭━━〔 ✅ GOODBYE DISABLED 〕━━⬣
┃
┃ Goodbye messages
┃ have been disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

        } catch (error) {

            console.log(
                'Goodbye Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ goodbye command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}