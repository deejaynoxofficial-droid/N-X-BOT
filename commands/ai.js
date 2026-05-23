const axios = require('axios')
const fs = require('fs')
const settings = require('../settings')

module.exports = {
    name: 'ai',

    async execute(sock, msg, args) {

        const from = msg.key.remoteJid

        try {

            const query =
                args.join(' ').trim()

            if (!query) {

                return await sock.sendMessage(from, {
                    text:
`╭━━━〔 🤖 AI CHAT 〕━━━⬣
┃
┃ Usage:
┃ .ai your question
┃
┃ Example:
┃ .ai hello
┃ .ai explain javascript
┃ .ai tell me a joke
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            // BLOCKED WORDS
            const blockedWords = [
                'hack',
                'ddos',
                'malware',
                'virus',
                'phishing',
                'exploit',
                'crack',
                'carding',
                'bypass',
                'steal'
            ]

            const lowerQuery =
                query.toLowerCase()

            const blocked =
                blockedWords.some(word =>
                    lowerQuery.includes(word)
                )

            if (blocked) {

                return await sock.sendMessage(from, {
                    text:
                        '❌ Unsafe requests are blocked.'
                })
            }

            // WAIT MESSAGE
            await sock.sendMessage(from, {
                text: '🤖 AI is thinking...'
            })

            // API REQUEST
            const response =
                await axios.get(

`${settings.APIs.neoxr}/api/openai?text=${encodeURIComponent(query)}&apikey=${settings.apiKey}`

                )

            let aiReply =
                response.data?.result ||
                response.data?.message ||
                'No response received.'

            // CLEAN RESPONSE
            aiReply =
                aiReply
                    .replace(
                        /<script.*?>.*?<\/script>/gi,
                        ''
                    )
                    .trim()

            if (!aiReply) {

                aiReply =
                    '⚠️ Empty AI response.'
            }

            const finalText =
`╭━━━〔 🤖 AI RESPONSE 〕━━━⬣
┃
${aiReply}
┃
╰━━━━━━━━━━━━━━━━━━⬣

${settings.footer}`

            // SEND IMAGE IF EXISTS
            if (
                settings.botImage &&
                fs.existsSync(settings.botImage)
            ) {

                await sock.sendMessage(from, {
                    image: fs.readFileSync(settings.botImage),
                    caption: finalText
                })

            } else {

                await sock.sendMessage(from, {
                    text: finalText
                })
            }

        } catch (error) {

            console.log(
                'AI Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
                        '❌ Failed to generate AI response.'
                })

            } catch {}
        }
    }
}