const axios = require('axios')
const settings = require('../settings')

module.exports = {
    name: 'ytmp3',

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

            const query =
                args.join(' ').trim()

            if (!query) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 🎵 YTMP3 DOWNLOAD 〕━━⬣
┃
┃ 📌 Example:
┃ .ytmp3 faded alan walker
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                query.length > 100
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID QUERY 〕━━⬣
┃
┃ Search query is
┃ too long.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 🔎 SEARCHING 〕━━⬣
┃
┃ Searching YouTube
┃ audio results...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const response =
                await axios.get(
`${settings.APIs.neoxr}/api/youtube-search?q=${encodeURIComponent(query)}&apikey=${settings.apiKey}`,
                    {
                        timeout: 30000,
                        validateStatus:
                            () => true
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
`╭━━〔 ❌ SEARCH FAILED 〕━━⬣
┃
┃ Failed to fetch
┃ YouTube results.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const data =
                response.data

            if (
                !data ||
                !Array.isArray(
                    data.result
                ) ||
                data.result.length === 0
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ NO RESULTS 〕━━⬣
┃
┃ No audio results
┃ were found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const result =
                data.result[0]

            const title =
                result.title ||
                'Unknown Title'

            const duration =
                result.duration ||
                'Unknown'

            const views =
                result.views ||
                'Unknown'

            const url =
                result.url ||
                'No link'

            const thumbnail =
                result.thumbnail

            const caption =
`╭━━〔 🎵 AUDIO FOUND 〕━━⬣
┃
┃ 📌 Title:
┃ ${title}
┃
┃ ⏱ Duration:
┃ ${duration}
┃
┃ 👀 Views:
┃ ${views}
┃
┃ 🔗 Link:
┃ ${url}
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            try {

                if (
                    thumbnail &&
                    typeof thumbnail ===
                        'string'
                ) {

                    await sock.sendMessage(
                        from,
                        {
                            image: {
                                url: thumbnail
                            },
                            caption
                        }
                    )

                } else {

                    await sock.sendMessage(
                        from,
                        {
                            text: caption
                        }
                    )
                }

            } catch (sendError) {

                console.log(
                    'YTMP3 Send Error:',
                    sendError
                )

                await sock.sendMessage(from, {
                    text: caption
                })
            }

        } catch (error) {

            console.log(
                'YTMP3 Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ COMMAND FAILED 〕━━⬣
┃
┃ Failed to execute
┃ ytmp3 command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}