const axios = require('axios')

let settings = {}

try {

    settings = require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'spotify',

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
`╭━━〔 🎵 SPOTIFY SEARCH 〕━━⬣
┃
┃ 📌 Usage:
┃ .spotify alan walker
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
┃ Search query is too long.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !settings ||
                typeof settings !==
                    'object' ||
                !settings.APIs ||
                typeof settings.APIs.neoxr !==
                    'string' ||
                typeof settings.apiKey !==
                    'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ⚠️ API ERROR 〕━━⬣
┃
┃ Spotify API is not
┃ configured correctly.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 🔎 SEARCHING SPOTIFY 〕━━⬣
┃
┃ Searching tracks...
┃ Please wait.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const response =
                await axios.get(
`${settings.APIs.neoxr}/api/spotify?q=${encodeURIComponent(query)}&apikey=${encodeURIComponent(settings.apiKey)}`,
                    {
                        timeout: 30000,

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

            if (
                !response ||
                response.status !== 200
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ Failed to fetch
┃ Spotify results.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const body =
                response.data

            if (
                !body ||
                typeof body !== 'object'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID RESPONSE 〕━━⬣
┃
┃ API returned invalid data.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const results =
                body.result ||
                body.data

            if (
                !Array.isArray(results) ||
                results.length === 0
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ NO RESULTS 〕━━⬣
┃
┃ No Spotify tracks found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const song =
                results[0]

            const title =
                typeof song.title ===
                    'string'
                    ? song.title
                    : 'Unknown'

            const artist =
                typeof song.artist ===
                    'string'
                    ? song.artist
                    : 'Unknown'

            const duration =
                typeof song.duration ===
                    'string'
                    ? song.duration
                    : 'Unknown'

            const url =
                typeof song.url ===
                    'string'
                    ? song.url
                    : 'No link available'

            const thumbnail =
                typeof song.thumbnail ===
                    'string'
                    ? song.thumbnail
                    : null

            const caption =
`╭━━〔 🎵 SPOTIFY RESULT 〕━━⬣
┃
┃ 📌 Title:
┃ ${title}
┃
┃ 🎤 Artist:
┃ ${artist}
┃
┃ ⏱ Duration:
┃ ${duration}
┃
┃ 🔗 Link:
┃ ${url}
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            try {

                if (thumbnail) {

                    await sock.sendMessage(
                        from,
                        {
                            image: {
                                url:
                                    thumbnail
                            },

                            caption
                        }
                    )

                } else {

                    await sock.sendMessage(
                        from,
                        {
                            text:
                                caption
                        }
                    )
                }

            } catch (sendError) {

                console.log(
                    'Spotify Send Error:',
                    sendError
                )

                await sock.sendMessage(from, {
                    text:
                        caption
                })
            }

        } catch (error) {

            console.log(
                'Spotify Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ COMMAND ERROR 〕━━⬣
┃
┃ Failed to fetch
┃ Spotify results.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}