const axios = require('axios')
const fs = require('fs')
const settings = require('../settings')

module.exports = {
    name: 'tourl',

    async execute(sock, msg) {

        const from = msg.key.remoteJid

        try {

            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

            if (!quoted) {
                return sock.sendMessage(from, {
                    text: 'Reply to an image or video.'
                })
            }

            await sock.sendMessage(from, {
                text: 'Uploading media...'
            })

            const message = quoted.imageMessage || quoted.videoMessage

            if (!message) {
                return sock.sendMessage(from, {
                    text: 'Reply to an image or video only.'
                })
            }

            const stream = await downloadContentFromMessage(
                message,
                quoted.imageMessage ? 'image' : 'video'
            )

            let buffer = Buffer.from([])

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }

            fs.writeFileSync('./temp.jpg', buffer)

            const form = new FormData()
            form.append('file', fs.createReadStream('./temp.jpg'))

            const response = await axios.post(
                `${settings.APIs.neoxr}/api/tourl?apikey=${settings.apiKey}`,
                form,
                {
                    headers: form.getHeaders()
                }
            )

            const data = response.data

            await sock.sendMessage(from, {
                text: `✅ Uploaded Successfully\n\n🔗 ${data.data.url}`
            })

            fs.unlinkSync('./temp.jpg')

        } catch (error) {

            console.log(error)

            await sock.sendMessage(from, {
                text: 'Failed to upload media.'
            })
        }
    }
}