const fs = require('fs')
const path = require('path')

const dbFolder = path.join(
    __dirname,
    '../database'
)

const dbPath = path.join(
    dbFolder,
    'banned.json'
)

module.exports = {
    name: 'unban',

    async execute(sock, msg) {

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
`╭━━〔 ✅ UNBAN COMMAND 〕━━⬣
┃
┃ ❌ This command only
┃ works in groups.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const sender =
                msg?.key?.participant ||
                msg?.participant ||
                null

            if (!sender) {
                return
            }

            const contextInfo =
                msg?.message
                    ?.extendedTextMessage
                    ?.contextInfo || null

            let target = null

            if (
                typeof contextInfo?.participant ===
                    'string'
            ) {

                target =
                    contextInfo.participant

            } else if (
                Array.isArray(
                    contextInfo?.mentionedJid
                ) &&
                contextInfo.mentionedJid.length > 0
            ) {

                target =
                    contextInfo
                        .mentionedJid[0]
            }

            if (!target) {
                return sock.sendMessage(from, {
                    text:
`╭━━〔 ✅ UNBAN COMMAND 〕━━⬣
┃
┃ Reply to or mention
┃ a user to unban.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const metadata =
                await sock.groupMetadata(
                    from
                )

            const participants =
                metadata.participants || []

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

            const botNumber =
                sock.user.id
                    .split(':')[0] +
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
┃ to manage users.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

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

            let bannedUsers = []

            if (
                fs.existsSync(
                    dbPath
                )
            ) {

                bannedUsers =
                    JSON.parse(
                        fs.readFileSync(
                            dbPath
                        )
                    )
            }

            if (
                !Array.isArray(
                    bannedUsers
                )
            ) {

                bannedUsers = []
            }

            const isBanned =
                bannedUsers.includes(
                    target
                )

            if (!isBanned) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ⚠️ USER NOT BANNED 〕━━⬣
┃
┃ User is not
┃ currently banned.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            bannedUsers =
                bannedUsers.filter(
                    user =>
                        user !== target
                )

            fs.writeFileSync(
                dbPath,
                JSON.stringify(
                    bannedUsers,
                    null,
                    2
                )
            )

            await sock.sendMessage(from, {
                text:
`╭━━〔 ✅ USER UNBANNED 〕━━⬣
┃
┃ 👤 User:
┃ @${target.split('@')[0]}
┃
┃ ✅ Successfully unbanned
┃ from bot usage.
┃
╰━━━━━━━━━━━━━━━━━━⬣`,
                mentions: [target]
            })

        } catch (error) {

            console.log(
                'Unban Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ unban command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}