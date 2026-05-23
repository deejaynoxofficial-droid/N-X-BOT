const axios = require('axios')

let settings = {}

try {

    settings =
        require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'play',

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
`╭━━〔 🎵 PLAY COMMAND 〕━━⬣
┃
┃ Example:
┃ .play faded
┃ .play unstoppable
┃ .play believer
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
┃ not found.
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
`╭━━〔 🔍 SEARCHING 〕━━⬣
┃
┃ Searching for:
┃ ${query}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const apiUrl =
`${settings.APIs.neoxr}/api/play?q=${encodeURIComponent(query)}&apikey=${encodeURIComponent(settings.apiKey)}`

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
                    'Play API Error:',
                    apiError
                )

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ Failed to connect
┃ to music server.
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

            const data =
                body.data || null

            if (
                !data ||
                typeof data !==
                    'object'
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ NOT FOUND 〕━━⬣
┃
┃ Song not found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const title =
                typeof data.title ===
                'string'
                    ? data.title
                    : 'Unknown'

            const duration =
                typeof data.duration ===
                'string'
                    ? data.duration
                    : 'Unknown'

            const author =
                typeof data.author ===
                'string'
                    ? data.author
                    : 'Unknown'

            const thumbnail =
                typeof data.thumbnail ===
                'string'
                    ? data.thumbnail
                    : null

            const audioUrl =
                data.url ||
                data.audio ||
                data.download ||
                null

            if (
                !audioUrl ||
                typeof audioUrl !==
                    'string'
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ DOWNLOAD ERROR 〕━━⬣
┃
┃ Audio URL not
┃ available.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const caption =
`╭━━〔 🎵 PLAY MUSIC 〕━━⬣
┃
┃ 📌 Title:
┃ ${title}
┃
┃ ⏱ Duration:
┃ ${duration}
┃
┃ 👤 Author:
┃ ${author}
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

            } catch (thumbnailError) {

                console.log(
                    'Thumbnail Error:',
                    thumbnailError
                )

                await sock.sendMessage(from, {
                    text: caption
                })
            }

            try {

                await sock.sendMessage(from, {
                    audio: {
                        url: audioUrl
                    },
                    mimetype:
                        'audio/mpeg',
                    fileName:
`${title}.mp3`
                })

            } catch (audioError) {

                console.log(
                    'Audio Send Error:',
                    audioError
                )

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ SEND FAILED 〕━━⬣
┃
┃ Failed to send
┃ audio file.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

        } catch (error) {

            console.log(
                'Play Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ play command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}