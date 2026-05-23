const axios = require('axios')
const settings = require('../settings')

module.exports = {
    name: 'instagram',

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
`╭━━〔 📸 INSTAGRAM DOWNLOAD 〕━━⬣
┃
┃ 📌 Example:
┃ .instagram https://instagram.com/reel/...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !url.includes(
                    'instagram.com'
                )
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID URL 〕━━⬣
┃
┃ Please provide a
┃ valid Instagram link.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 📥 DOWNLOADING 〕━━⬣
┃
┃ Processing Instagram
┃ media request...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const response =
                await axios.get(
`${settings.APIs.neoxr}/api/instagram?url=${encodeURIComponent(url)}&apikey=${settings.apiKey}`,
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
┃ Instagram media.
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

            const mediaUrl =
                result.video ||
                result.url ||
                result.media

            const thumbnail =
                result.thumbnail ||
                result.image

            const title =
                result.title ||
                result.caption ||
                'No caption available'

            const caption =
`╭━━〔 📸 INSTAGRAM MEDIA 〕━━⬣
┃
┃ 📝 Caption:
┃ ${title}
┃
┃ 🔗 Link:
┃ ${url}
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            if (!mediaUrl) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ MEDIA NOT FOUND 〕━━⬣
┃
┃ Failed to locate
┃ downloadable media.
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
                            url: mediaUrl
                        },
                        caption
                    }
                )

            } catch (mediaError) {

                console.log(
                    'Instagram Media Send Error:',
                    mediaError
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

🎥 Media:
${mediaUrl}`
                        }
                    )

                } else {

                    await sock.sendMessage(
                        from,
                        {
                            text:
`${caption}

🎥 Media:
${mediaUrl}`
                        }
                    )
                }
            }

        } catch (error) {

            console.log(
                'Instagram Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ COMMAND FAILED 〕━━⬣
┃
┃ Failed to execute
┃ instagram command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}