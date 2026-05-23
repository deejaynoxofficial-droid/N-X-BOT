const axios = require('axios')
const settings = require('../settings')

module.exports = {
    name: 'translate',

    async execute(sock, msg, args) {

        const from =
            msg?.key?.remoteJid

        try {

            if (
                !from ||
                typeof from !== 'string'
            ) {
                return
            }

            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            const text =
                args.join(' ').trim()

            if (!text) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 🌍 TRANSLATE 〕━━━⬣
┃
┃ ✨ Translate text instantly
┃
┣━━〔 📌 EXAMPLE 〕━━⬣
┃ .translate hello
┃ .translate how are you
┃ .translate good morning
┃
╰━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (text.length > 500) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ ERROR 〕━━━⬣
┃
┃ Text is too long.
┃ Maximum: 500 characters
┃
╰━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !settings ||
                !settings.APIs ||
                !settings.APIs.neoxr ||
                !settings.apiKey
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ⚠️ API ERROR 〕━━━⬣
┃
┃ API configuration missing.
┃ Check settings.js
┃
╰━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━━〔 🌍 TRANSLATOR 〕━━━⬣
┃
┃ 🔄 Translating text...
┃ Please wait a moment
┃
╰━━━━━━━━━━━━━━━━⬣`
            })

            const response =
                await axios.get(
                    `${settings.APIs.neoxr}/api/translate?q=${encodeURIComponent(text)}&apikey=${settings.apiKey}`,
                    {
                        timeout: 30000,

                        validateStatus:
                            () => true,

                        headers: {
                            Accept:
                                'application/json'
                        }
                    }
                )

            if (
                !response ||
                response.status !== 200
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ FAILED 〕━━━⬣
┃
┃ Failed to translate text.
┃ Try again later.
┃
╰━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const data =
                response.data

            if (
                !data ||
                typeof data !== 'object'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ⚠️ ERROR 〕━━━⬣
┃
┃ Invalid API response.
┃
╰━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const translated =
                data.data?.translated ||
                data.result?.translated ||
                'No translation found.'

            const language =
                data.data?.language ||
                data.result?.language ||
                'Unknown'

            const result =
`╭━━━〔 🌍 TRANSLATION RESULT 〕━━━⬣
┃
┣━━〔 📝 ORIGINAL 〕━━⬣
┃ ${text}
┃
┣━━〔 📖 TRANSLATED 〕━━⬣
┃ ${translated}
┃
┣━━〔 🌐 LANGUAGE 〕━━⬣
┃ ${language}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(from, {
                text: result
            })

        } catch (error) {

            console.log(
                'Translate Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ ERROR 〕━━━⬣
┃
┃ Failed to execute
┃ translate command.
┃
╰━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}