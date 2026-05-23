const axios = require('axios')
const settings = require('../settings')

module.exports = {
    name: 'facebook',

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
`╭━━〔 📘 FACEBOOK DOWNLOAD 〕━━⬣
┃
┃ 📌 Example:
┃ .facebook https://facebook.com/...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !url.includes(
                    'facebook.com'
                ) &&
                !url.includes(
                    'fb.watch'
                )
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID URL 〕━━⬣
┃
┃ Please provide a
┃ valid Facebook link.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 📥 DOWNLOADING 〕━━⬣
┃
┃ Processing Facebook
┃ video request...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const response =
                await axios.get(
`${settings.APIs.neoxr}/api/facebook?url=${encodeURIComponent(url)}&apikey=${settings.apiKey}`,
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
┃ Facebook video.
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
                result.url

            const title =
                result.title ||
                'No title available'

            const thumbnail =
                result.thumbnail ||
                result.image

            const caption =
`╭━━〔 📘 FACEBOOK VIDEO 〕━━⬣
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
                    'Facebook Video Send Error:',
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
                'Facebook Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ COMMAND FAILED 〕━━⬣
┃
┃ Failed to execute
┃ facebook command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}