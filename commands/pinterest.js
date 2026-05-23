const axios = require('axios')

let settings = {}

try {

    settings = require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'pinterest',

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

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 📌 PINTEREST SEARCH 〕━━⬣
┃
┃ 📌 Usage:
┃ .pinterest anime
┃ .pinterest cars
┃ .pinterest wallpapers
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
┃ Pinterest API is not
┃ configured correctly.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 🔎 SEARCHING PINTEREST 〕━━⬣
┃
┃ Searching images...
┃ Please wait.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const response =
                await axios.get(
`${settings.APIs.neoxr}/api/pinterest?q=${encodeURIComponent(query)}&apikey=${encodeURIComponent(settings.apiKey)}`,
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
┃ Pinterest results.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const body =
                response.data

            if (
                !body ||
                typeof body !==
                    'object'
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
┃ No Pinterest images
┃ were found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const validImages =
                results.filter(
                    image =>
                        typeof image ===
                            'string' &&
                        image.startsWith(
                            'http'
                        )
                )

            if (
                validImages.length === 0
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID IMAGES 〕━━⬣
┃
┃ No valid Pinterest
┃ images were found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const randomIndex =
                Math.floor(
                    Math.random() *
                    validImages.length
                )

            const selectedImage =
                validImages[randomIndex]

            if (
                !selectedImage ||
                typeof selectedImage !==
                    'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ IMAGE ERROR 〕━━⬣
┃
┃ Failed to select image.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const caption =
`╭━━〔 📌 PINTEREST RESULT 〕━━⬣
┃
┃ 🔎 Query:
┃ ${query}
┃
┃ 🖼 Status:
┃ Image found successfully.
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            try {

                await sock.sendMessage(
                    from,
                    {
                        image: {
                            url:
                                selectedImage
                        },

                        caption
                    }
                )

            } catch (sendError) {

                console.log(
                    'Pinterest Send Error:',
                    sendError
                )

                await sock.sendMessage(from, {
                    text:
`${caption}

🔗 ${selectedImage}`
                })
            }

        } catch (error) {

            console.log(
                'Pinterest Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ COMMAND ERROR 〕━━⬣
┃
┃ Failed to fetch
┃ Pinterest images.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}