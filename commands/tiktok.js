const axios = require('axios')
const settings = require('../settings')

module.exports = {
    name: 'tiktok',

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
`╭━━〔 🎵 TIKTOK DOWNLOAD 〕━━⬣
┃
┃ 📌 Example:
┃ .tiktok https://vt.tiktok.com/...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !url.includes(
                    'tiktok.com'
                ) &&
                !url.includes(
                    'vt.tiktok.com'
                )
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID URL 〕━━⬣
┃
┃ Please provide a
┃ valid TikTok link.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 📥 DOWNLOADING 〕━━⬣
┃
┃ Processing TikTok
┃ video request...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const response =
                await axios.get(
`${settings.APIs.neoxr}/api/tiktok?url=${encodeURIComponent(url)}&apikey=${settings.apiKey}`,
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
`╭━━〔 ❌ DOWNLOAD FAILED 〕━━⬣
┃
┃ Failed to fetch
┃ TikTok video.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
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
`╭━━〔 ❌ INVALID RESPONSE 〕━━⬣
┃
┃ Invalid API
┃ response received.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const result =
                data.data ||
                data.result ||
                {}

            const videoUrl =
                result.video ||
                result.nowm ||
                result.url

            const thumbnail =
                result.thumbnail ||
                result.cover

            const title =
                result.title ||
                'No title available'

            const author =
                result.author ||
                result.username ||
                'Unknown'

            const caption =
`╭━━〔 🎵 TIKTOK VIDEO 〕━━⬣
┃
┃ 👤 Author:
┃ ${author}
┃
┃ 📝 Title:
┃ ${title}
┃
┃ 🔗 Link:
┃ ${url}
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            if (!videoUrl) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ VIDEO NOT FOUND 〕━━⬣
┃
┃ Failed to locate
┃ downloadable video.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            try {

                await sock.sendMessage(
                    from,
                    {
                        video: {
                            url: videoUrl
                        },
                        caption
                    }
                )

            } catch (videoError) {

                console.log(
                    'TikTok Video Send Error:',
                    videoError
                )

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
                            caption:
`${caption}

🎥 Video:
${videoUrl}`
                        }
                    )

                } else {

                    await sock.sendMessage(
                        from,
                        {
                            text:
`${caption}

🎥 Video:
${videoUrl}`
                        }
                    )
                }
            }

        } catch (error) {

            console.log(
                'TikTok Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ COMMAND FAILED 〕━━⬣
┃
┃ Failed to execute
┃ tiktok command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}