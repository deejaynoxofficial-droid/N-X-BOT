const axios = require('axios')

let settings = {}

try {

    settings =
        require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'anime',

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
                typeof from !==
                    'string'
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
`╭━━〔 🌸 ANIME COMMAND 〕━━⬣
┃
┃ Example:
┃ .anime naruto
┃ .anime one piece
┃ .anime demon slayer
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                query.length > 150
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Query is too
┃ long.
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
┃ Anime API URL
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
`╭━━〔 🔍 SEARCHING ANIME 〕━━⬣
┃
┃ Query:
┃ ${query}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const apiUrl =
`${settings.APIs.neoxr}/api/anime?q=${encodeURIComponent(query)}&apikey=${encodeURIComponent(settings.apiKey)}`

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
                    'Anime API Error:',
                    apiError
                )

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ Failed to connect
┃ to anime server.
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

            const animeData =
                body.data || null

            if (
                !animeData ||
                typeof animeData !==
                    'object'
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ NOT FOUND 〕━━⬣
┃
┃ No anime found
┃ for your query.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const title =
                typeof animeData.title ===
                'string'
                    ? animeData.title
                    : 'Unknown'

            const rating =
                typeof animeData.rating ===
                'string'
                    ? animeData.rating
                    : 'Unknown'

            const genre =
                typeof animeData.genre ===
                'string'
                    ? animeData.genre
                    : 'Unknown'

            const episodes =
                animeData.episodes ||
                'Unknown'

            const status =
                typeof animeData.status ===
                'string'
                    ? animeData.status
                    : 'Unknown'

            const synopsis =
                typeof animeData.synopsis ===
                'string'
                    ? animeData.synopsis
                    : 'No synopsis available.'

            const link =
                typeof animeData.url ===
                'string'
                    ? animeData.url
                    : 'Unavailable'

            const image =
                typeof animeData.image ===
                    'string' &&
                animeData.image.startsWith(
                    'http'
                )
                    ? animeData.image
                    : null

            const safeSynopsis =
                synopsis.length > 1000
                    ? synopsis.slice(0, 1000) +
                      '...'
                    : synopsis

            const caption =
`╭━━〔 🌸 ANIME FOUND 〕━━⬣
┃
┃ 📌 Title:
┃ ${title}
┃
┃ ⭐ Rating:
┃ ${rating}
┃
┃ 🎭 Genre:
┃ ${genre}
┃
┃ 📺 Episodes:
┃ ${episodes}
┃
┃ 📅 Status:
┃ ${status}
┃
┃ 📝 Synopsis:
┃ ${safeSynopsis}
┃
┃ 🔗 Link:
┃ ${link}
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            try {

                if (image) {

                    await sock.sendMessage(from, {
                        image: {
                            url: image
                        },
                        caption
                    })

                } else {

                    await sock.sendMessage(from, {
                        text: caption
                    })
                }

            } catch (sendError) {

                console.log(
                    'Anime Send Error:',
                    sendError
                )

                await sock.sendMessage(from, {
                    text: caption
                })
            }

        } catch (error) {

            console.log(
                'Anime Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ anime command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}