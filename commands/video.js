const axios = require('axios')

let settings = {}

try {

    settings =
        require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'video',

    async execute(sock, msg, args) {

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
                !Array.isArray(args)
            ) {
                args = []
            }

            const query =
                args.join(' ').trim()

            if (!query) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 🎬 VIDEO COMMAND 〕━━⬣
┃
┃ Example:
┃ .video avengers
┃ .video alan walker
┃ .video mrbeast
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                query.length > 200
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Search query is
┃ too long.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                !settings ||
                typeof settings !==
                    'object'
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ SETTINGS ERROR 〕━━⬣
┃
┃ Settings file
┃ missing.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                !settings.APIs ||
                typeof settings.APIs.neoxr !==
                    'string'
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ API URL is
┃ missing.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                typeof settings.apiKey !==
                    'string' ||
                settings.apiKey.trim() ===
                    ''
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ API key is
┃ missing.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 🔍 SEARCHING VIDEO 〕━━⬣
┃
┃ Query:
┃ ${query}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const apiUrl =
`${settings.APIs.neoxr}/api/youtube-search?q=${encodeURIComponent(query)}&apikey=${encodeURIComponent(settings.apiKey)}`

            let response = null

            try {

                response =
                    await axios.get(
                        apiUrl,
                        {
                            timeout: 30000,
                            maxRedirects: 5,
                            validateStatus:
                                () => true,
                            headers: {
                                Accept:
                                    'application/json',
                                'User-Agent':
                                    'Mozilla/5.0'
                            }
                        }
                    )

            } catch (apiError) {

                console.log(
                    'Video API Error:',
                    apiError
                )

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ Failed to connect
┃ to video server.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                !response ||
                typeof response !==
                    'object'
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Invalid API
┃ response.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                response.status !== 200
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ API FAILED 〕━━⬣
┃
┃ Server returned
┃ status ${response.status}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const body =
                response.data || {}

            if (
                !body ||
                typeof body !==
                    'object'
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Malformed API
┃ response.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const results =
                Array.isArray(
                    body.result
                )
                    ? body.result
                    : []

            if (
                results.length === 0
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ NOT FOUND 〕━━⬣
┃
┃ No video results
┃ found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const video =
                results[0] || {}

            const title =
                typeof video.title ===
                'string'
                    ? video.title
                    : 'Unknown'

            const duration =
                typeof video.duration ===
                'string'
                    ? video.duration
                    : 'Unknown'

            const views =
                typeof video.views ===
                'string'
                    ? video.views
                    : 'Unknown'

            const thumbnail =
                typeof video.thumbnail ===
                'string'
                    ? video.thumbnail
                    : null

            const url =
                typeof video.url ===
                'string'
                    ? video.url
                    : null

            const caption =
`╭━━〔 🎬 VIDEO FOUND 〕━━⬣
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
┃ ${url || 'Unavailable'}
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            try {

                if (thumbnail) {

                    await sock.sendMessage(from, {
                        image: {
                            url: thumbnail
                        },
                        caption
                    })

                } else {

                    await sock.sendMessage(from, {
                        text: caption
                    })
                }

            } catch (imageError) {

                console.log(
                    'Thumbnail Error:',
                    imageError
                )

                await sock.sendMessage(from, {
                    text: caption
                })
            }

        } catch (error) {

            console.log(
                'Video Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ video command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}