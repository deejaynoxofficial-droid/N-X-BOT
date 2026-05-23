const axios = require('axios')
const settings = require('../settings')

module.exports = {
    name: 'shorturl',

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

            const url =
                args[0]?.trim()

            if (!url) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 🔗 SHORTURL MENU 〕━━━⬣
┃
┃ 📌 Usage:
┃ .shorturl https://google.com
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const validUrl =
                /^https?:\/\/.+/i.test(url)

            if (!validUrl) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ INVALID URL 〕━━━⬣
┃
┃ Please send a valid URL
┃ starting with:
┃
┃ 🌐 http://
┃ 🌐 https://
┃
╰━━━━━━━━━━━━━━━━━━⬣`
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
`╭━━━〔 ❌ API ERROR 〕━━━⬣
┃
┃ API configuration missing.
┃ Check your settings.js
┃ and .env file.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━━〔 🔄 PROCESSING 〕━━━⬣
┃
┃ ⚡ Shortening your URL...
┃ Please wait a moment.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const response =
                await axios.get(
`${settings.APIs.neoxr}/api/shorturl?url=${encodeURIComponent(url)}&apikey=${settings.apiKey}`,
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
`╭━━━〔 ❌ API FAILED 〕━━━⬣
┃
┃ Failed to shorten URL.
┃ API returned an error.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const data =
                response.data

            if (
                !data ||
                !data.data
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ INVALID RESPONSE 〕━━━⬣
┃
┃ API returned invalid data.
┃ Please try again later.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const shortUrl =
                data.data.url ||
                data.data.short ||
                data.data.shortUrl

            if (
                !shortUrl
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ SHORT URL FAILED 〕━━━⬣
┃
┃ No shortened URL received.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const text =
`╭━━━〔 ✅ URL SHORTENED 〕━━━⬣
┃
┃ 🌐 ORIGINAL URL:
┃ ${url}
┃
┣━━━━━━━━━━━━━━━━⬣
┃
┃ 🔗 SHORT URL:
┃ ${shortUrl}
┃
┣━━━━━━━━━━━━━━━━⬣
┃
┃ ⚡ STATUS: SUCCESS
┃ 🤖 BOT: NOX SPARROW BOT
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(from, {
                text
            })

        } catch (error) {

            console.log(
                'ShortURL Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ COMMAND ERROR 〕━━━⬣
┃
┃ Failed to shorten URL.
┃ Please try again later.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}