const fs = require('fs')
const settings = require('../settings')

module.exports = {
    name: 'tagall',

    async execute(sock, msg) {

        const from = msg.key.remoteJid

        try {

            // GROUP CHECK
            if (!from.endsWith('@g.us')) {

                return await sock.sendMessage(from, {
                    text: '❌ This command only works in groups.'
                })
            }

            const metadata =
                await sock.groupMetadata(from)

            const participants =
                metadata.participants

            const sender =
                msg.key.participant || from

            // CHECK ADMIN
            const admins =
                participants.filter(
                    p => p.admin !== null
                )

            const isAdmin =
                admins.some(
                    admin => admin.id === sender
                )

            if (!isAdmin) {

                return await sock.sendMessage(from, {
                    text: '❌ Admin only command.'
                })
            }

            let text = `
╭━━━〔 📢 TAG ALL 〕━━━⬣
┃
┃ 👥 Group: ${metadata.subject}
┃ 📦 Members: ${participants.length}
┃
╰━━━━━━━━━━━━━━━━━━⬣

`

            const mentions = []

            for (const member of participants) {

                mentions.push(member.id)

                text += `➤ @${member.id.split('@')[0]}\n`
            }

            // SEND WITH IMAGE
            if (
                settings.botImage &&
                fs.existsSync(settings.botImage)
            ) {

                await sock.sendMessage(from, {
                    image: fs.readFileSync(settings.botImage),
                    caption: text,
                    mentions
                })

            } else {

                await sock.sendMessage(from, {
                    text,
                    mentions
                })
            }

        } catch (error) {

            console.log(
                'Tagall Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text: '❌ Failed to tag members.'
                })

            } catch {}
        }
    }
}