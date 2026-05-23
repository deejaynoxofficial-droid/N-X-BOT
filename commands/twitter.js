const axios = require('axios')

let settings = {}

try {

    settings =
        require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'twitter',

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

            const url =
                args[0]?.trim() || ''

            if (!url) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 🐦 TWITTER DOWNLOAD 〕━━⬣
┃
┃ Example:
┃ .twitter https://x.com/...
┃ .twitter https://twitter.com/...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const validDomains = [
                'twitter.com',
                'x.com'
            ]

            const isValidUrl =
                validDomains.some(
                    domain =>
                        url.includes(domain)
                )

            if (!isValidUrl) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ INVALID URL 〕━━⬣
┃
┃ Please provide a valid
┃ Twitter/X link.
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
`╭━━〔 ⏳ DOWNLOADING 〕━━⬣
┃
┃ Fetching Twitter/X
┃ video...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const apiUrl =
`${settings.APIs.neoxr}/api/twitter?url=${encodeURIComponent(url)}&apikey=${encodeURIComponent(settings.apiKey)}`

            let response = null

            try {

                response =
                    await axios.get(
                        apiUrl,
                        {
                            timeout: 60000,
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
                    'Twitter API Error:',
                    apiError
                )

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ Failed to connect
┃ to Twitter server.
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
                body.data || body.result || {}

            if (
                !data ||
                typeof data !==
                    'object'
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ NOT FOUND 〕━━⬣
┃
┃ No downloadable
┃ media found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const videoUrl =
                data.url ||
                data.video ||
                data.download ||
                null

            if (
                !videoUrl ||
                typeof videoUrl !==
                    'string'
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ DOWNLOAD FAILED 〕━━⬣
┃
┃ Unable to fetch
┃ Twitter video.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const caption =
`╭━━〔 🐦 TWITTER VIDEO 〕━━⬣
┃
┃ ✅ Download Complete
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            try {

                await sock.sendMessage(from, {
                    video: {
                        url: videoUrl
                    },
                    caption
                })

            } catch (videoError) {

                console.log(
                    'Twitter Video Error:',
                    videoError
                )

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ SEND FAILED 〕━━⬣
┃
┃ Failed to send
┃ Twitter video.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

        } catch (error) {

            console.log(
                'Twitter Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ twitter command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}