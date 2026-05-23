const axios = require('axios')

let settings = {}

try {

    settings = require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'image',

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

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ ERROR 〕━━━⬣
┃
┃ Invalid arguments.
┃
╰━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const query =
                args.join(' ').trim()

            if (!query) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 🖼 IMAGE SEARCH 〕━━━⬣
┃
┃ Search beautiful images
┃ from Pinterest instantly.
┃
┣━━〔 📌 EXAMPLES 〕━━⬣
┃ .image anime girl
┃ .image lamborghini
┃ .image nature
┃ .image wallpaper
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (query.length > 100) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ ERROR 〕━━━⬣
┃
┃ Query is too long.
┃ Maximum: 100 characters
┃
╰━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !settings ||
                typeof settings !== 'object'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ⚠️ SETTINGS ERROR 〕━━━⬣
┃
┃ Settings configuration
┃ is missing.
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !settings.APIs ||
                typeof settings.APIs.neoxr !==
                    'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ⚠️ API ERROR 〕━━━⬣
┃
┃ Image API is not
┃ configured correctly.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                typeof settings.apiKey !==
                    'string' ||
                settings.apiKey.trim() === ''
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 🔑 API KEY ERROR 〕━━━⬣
┃
┃ API key is missing.
┃ Check settings.js
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━━〔 🖼 IMAGE SEARCH 〕━━━⬣
┃
┃ 🔎 Searching images...
┃ Please wait a moment
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const apiUrl =
`${settings.APIs.neoxr}/api/pinterest?q=${encodeURIComponent(query)}&apikey=${encodeURIComponent(settings.apiKey)}`

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
                    'API Request Error:',
                    apiError
                )

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ CONNECTION ERROR 〕━━━⬣
┃
┃ Failed to connect
┃ to image API.
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !response ||
                typeof response !== 'object'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ RESPONSE ERROR 〕━━━⬣
┃
┃ Invalid API response.
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (response.status !== 200) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ API ERROR 〕━━━⬣
┃
┃ API returned:
┃ Status ${response.status}
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
`╭━━━〔 ❌ DATA ERROR 〕━━━⬣
┃
┃ Malformed API response.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const results =
                body.data

            if (
                !Array.isArray(results)
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ RESULT ERROR 〕━━━⬣
┃
┃ Invalid image results.
┃
╰━━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (results.length === 0) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 🖼 NO RESULTS 〕━━━⬣
┃
┃ No images found for:
┃ ${query}
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
`╭━━━〔 ❌ IMAGE ERROR 〕━━━⬣
┃
┃ No valid images
┃ were found.
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
`╭━━━〔 ❌ SELECTION ERROR 〕━━━⬣
┃
┃ Failed to select
┃ image result.
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            try {

                await sock.sendMessage(
                    from,
                    {
                        image: {
                            url:
                                selectedImage
                        },

                        caption:
`╭━━━〔 🖼 IMAGE RESULT 〕━━━⬣
┃
┃ 🔍 Query:
┃ ${query}
┃
┃ ✅ Image fetched
┃ successfully.
┃
╰━━━━━━━━━━━━━━━━━━⬣