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
    name: 'welcome',

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
`╭━━〔 ❌ WELCOME COMMAND 〕━━⬣
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
                return
            }

            const ownerNumbers = [
                '256700000000@s.whatsapp.net'
            ]

            let metadata = null

            try {

                metadata =
                    await sock.groupMetadata(
                        from
                    )

            } catch {

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

            const participants =
                metadata?.participants || []

            const admins =
                participants
                    .filter(
                        member =>
                            member.admin
                    )
                    .map(
                        member =>
                            member.id
                    )

            const normalizedSender =
                sender.includes(':')
                    ? sender.split(':')[0] +
                      '@s.whatsapp.net'
                    : sender

            const isAdmin =
                admins.includes(
                    normalizedSender
                )

            const isOwner =
                ownerNumbers.includes(
                    normalizedSender
                )

            if (
                !isAdmin &&
                !isOwner
            ) {
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
                typeof db.welcome !==
                    'object' ||
                db.welcome === null
            ) {

                db.welcome = {}
            }

            if (!option) {

                const status =
                    db.welcome[from] ===
                    true
                        ? 'ON'
                        : 'OFF'

                return sock.sendMessage(from, {
                    text:
`╭━━〔 👋 WELCOME SETTINGS 〕━━⬣
┃
┃ Current Status:
┃ ${status}
┃
┃ Usage:
┃ .welcome on
┃ .welcome off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                option !== 'on' &&
                option !== 'off'
            ) {
                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ INVALID OPTION 〕━━⬣
┃
┃ Use:
┃ .welcome on
┃ .welcome off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'on') {

                if (
                    db.welcome[from] ===
                    true
                ) {
                    return sock.sendMessage(from, {
                        text:
`╭━━〔 ⚠️ WELCOME 〕━━⬣
┃
┃ Welcome messages
┃ are already enabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }

                db.welcome[from] = true

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
`╭━━〔 ✅ WELCOME ENABLED 〕━━⬣
┃
┃ Welcome messages
┃ have been enabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'off') {

                if (
                    db.welcome[from] ===
                    false
                ) {
                    return sock.sendMessage(from, {
                        text:
`╭━━〔 ⚠️ WELCOME 〕━━⬣
┃
┃ Welcome messages
┃ are already disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }

                db.welcome[from] = false

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
`╭━━〔 ❌ WELCOME DISABLED 〕━━⬣
┃
┃ Welcome messages
┃ have been disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

        } catch (error) {

            console.log(
                'Welcome Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ welcome command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    },

    async run(sock, msg, args) {
        return this.execute(
            sock,
            msg,
            args
        )
    }
}
