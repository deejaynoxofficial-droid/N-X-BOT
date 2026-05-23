const fs = require('fs')
const path = require('path')

const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys')

module.exports = {
    name: 'setbotdp',

    async execute(sock, msg) {

        const from =
            msg?.key?.remoteJid

        try {

            if (
                !from ||
                typeof from !== 'string'
            ) {
                return
            }

            const quoted =
                msg.message
                    ?.extendedTextMessage
                    ?.contextInfo
                    ?.quotedMessage

            if (!quoted) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 🖼 SET BOT DP 〕━━⬣
┃
┃ Reply to an image
┃ with:
┃ .setbotdp
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const image =
                quoted.imageMessage

            if (!image) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID MEDIA 〕━━⬣
┃
┃ Please reply to
┃ an image only.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 ⏳ PROCESSING 〕━━⬣
┃
┃ Updating bot
┃ profile picture...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const stream =
                await downloadContentFromMessage(
                    image,
                    'image'
                )

            let buffer =
                Buffer.from([])

            for await (
                const chunk of stream
            ) {

                buffer =
                    Buffer.concat([
                        buffer,
                        chunk
                    ])
            }

            const filePath =
                path.join(
                    __dirname,
                    '../temp/botdp.jpg'
                )

            fs.writeFileSync(
                filePath,
                buffer
            )

            await sock.updateProfilePicture(
                sock.user.id,
                {
                    url: filePath
                }
            )

            if (
                fs.existsSync(filePath)
            ) {

                fs.unlinkSync(
                    filePath
                )
            }

            const text =
`╭━━〔 ✅ BOT DP UPDATED 〕━━⬣
┃
┃ 🤖 Bot profile picture
┃ updated successfully.
┃
┃ ⚡ Changes applied.
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(from, {
                text
            })

        } catch (error) {

            console.log(
                'SetBotDP Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ UPDATE FAILED 〕━━⬣
┃
┃ Failed to update
┃ bot profile picture.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}