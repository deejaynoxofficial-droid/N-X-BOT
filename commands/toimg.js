const axios = require('axios')
const fs = require('fs')
const FormData = require('form-data')

const settings = require('../settings')

const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys')

module.exports = {
    name: 'toimg',

    async execute(sock, msg) {

        const from = msg.key.remoteJid

        try {

            const quoted =
                msg.message?.extendedTextMessage
                    ?.contextInfo?.quotedMessage

            if (!quoted) {
                return sock.sendMessage(from, {
                    text: 'Reply to a sticker.'
                })
            }

            const sticker =
                quoted.stickerMessage

            if (!sticker) {
                return sock.sendMessage(from, {
                    text: 'Reply to a sticker only.'
                })
            }

            await sock.sendMessage(from, {
                text:
                    '🖼 Converting sticker to image...'
            })

            const stream =
                await downloadContentFromMessage(
                    sticker,
                    'sticker'
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

            const input =
                './temp.webp'

            fs.writeFileSync(
                input,
                buffer
            )

            const form =
                new FormData()

            form.append(
                'file',
                fs.createReadStream(input)
            )

            const response =
                await axios.post(
                    `${settings.APIs.neoxr}/api/toimg?apikey=${settings.apiKey}`,
                    form,
                    {
                        headers:
                            form.getHeaders()
                    }
                )

            const data =
                response.data

            if (
                !data ||
                !data.data ||
                !data.data.url
            ) {

                fs.unlinkSync(input)

                return sock.sendMessage(from, {
                    text:
                        'Failed to convert sticker.'
                })
            }

            await sock.sendMessage(from, {
                image: {
                    url:
                        data.data.url
                },
                caption:
`╭━━〔 🖼 STICKER TO IMAGE 〕━━⬣
┃
┃ ✅ Sticker converted successfully
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            fs.unlinkSync(input)

        } catch (error) {

            console.log(
                'ToImg Command Error:',
                error
            )

            try {

                if (
                    fs.existsSync(
                        './temp.webp'
                    )
                ) {

                    fs.unlinkSync(
                        './temp.webp'
                    )
                }

            } catch {}

            await sock.sendMessage(from, {
                text:
                    'Failed to convert sticker.'
            })
        }
    }
}