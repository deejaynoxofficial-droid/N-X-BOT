const axios = require('axios')
const settings = require('../settings')

module.exports = {
    name: 'news',

    async execute(sock, msg, args) {

        const from = msg.key.remoteJid

        try {

            const query =
                args.join(' ').trim()

            // NO QUERY
            if (!query) {

                return await sock.sendMessage(from, {
                    text:
`╭━━━〔 📰 NEWS SEARCH 〕━━━⬣
┃
┃ Usage:
┃ .news topic
┃
┃ Example:
┃ .news technology
┃ .news sports
┃ .news uganda
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            // LONG QUERY
            if (query.length > 100) {

                return await sock.sendMessage(from, {
                    text:
                        '❌ Query is too long.'
                })
            }

            // SETTINGS CHECK
            if (
                !settings ||
                !settings.APIs ||
                !settings.APIs.neoxr ||
                !settings.apiKey
            ) {

                return await sock.sendMessage(from, {
                    text:
                        '❌ API configuration missing.'
                })
            }

            // WAIT MESSAGE
            await sock.sendMessage(from, {
                text:
                    '📰 Fetching latest news...'
            })

            // API REQUEST
            const response =
                await axios.get(

`${settings.APIs.neoxr}/api/news?q=${encodeURIComponent(query)}&apikey=${settings.apiKey}`,

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

            // RESPONSE CHECK
            if (!response) {

                return await sock.sendMessage(from, {
                    text:
                        '❌ No response from API.'
                })
            }

            // STATUS CHECK
            if (response.status !== 200) {

                return await sock.sendMessage(from, {
                    text:
                        `❌ API Error: ${response.status}`
                })
            }

            const body =
                response.data

            // INVALID RESPONSE
            if (
                !body ||
                typeof body !== 'object'
            ) {

                return await sock.sendMessage(from, {
                    text:
                        '❌ Invalid API response.'
                })
            }

            const results =
                body.data

            // NO NEWS
            if (
                !Array.isArray(results) ||
                results.length === 0
            ) {

                return await sock.sendMessage(from, {
                    text:
                        '❌ No news found.'
                })
            }

            const news =
                results[0]

            const title =
                typeof news.title === 'string'
                    ? news.title
                    : 'Unknown'

            const description =
                typeof news.description === 'string'
                    ? news.description
                    : 'No description available.'

            const source =
                typeof news.source === 'string'
                    ? news.source
                    : 'Unknown'

            const link =
                typeof news.url === 'string'
                    ? news.url
                    : 'No link available.'

            const image =
                typeof news.image === 'string' &&
                news.image.startsWith('http')
                    ? news.image
                    : null

            // FINAL MESSAGE
            const text =
`╭━━━〔 📰 LATEST NEWS 〕━━━⬣
┃
┃ 📌 Title:
┃ ${title}
┃
┃ 🌍 Source:
┃ ${source}
┃
╰━━━━━━━━━━━━━━━━━━⬣

📝 Description:
${description}

🔗 ${link}

${settings.footer}`

            // SEND MESSAGE
            try {

                if (image) {

                    await sock.sendMessage(from, {
                        image: {
                            url: image
                        },
                        caption: text
                    })

                } else {

                    await sock.sendMessage(from, {
                        text
                    })
                }

            } catch {

                await sock.sendMessage(from, {
                    text
                })
            }

        } catch (error) {

            console.log(
                'News Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
                        '❌ Failed to fetch news.'
                })

            } catch {}
        }
    }
}