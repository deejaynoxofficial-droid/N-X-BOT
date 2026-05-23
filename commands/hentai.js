const axios = require('axios')
const fs = require('fs')
const path = require('path')

let settings = {}

try {

    settings = require('../settings')

} catch {

    settings = {}
}

const dbPath = path.join(
    __dirname,
    '../database/database.json'
)

module.exports = {
    name: 'animepic',

    async execute(sock, msg) {

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

            let prefix = '.'

            try {

                if (
                    fs.existsSync(dbPath)
                ) {

                    const raw =
                        fs.readFileSync(
                            dbPath,
                            'utf8'
                        )

                    if (
                        raw &&
                        raw.trim() !== ''
                    ) {

                        const db =
                            JSON.parse(raw)

                        if (
                            db &&
                            typeof db ===
                                'object' &&
                            typeof db.prefix ===
                                'string'
                        ) {

                            prefix =
                                db.prefix
                        }
                    }
                }

            } catch (dbError) {

                console.log(
                    'Database Error:',
                    dbError
                )
            }

            if (
                !settings ||
                typeof settings !==
                    'object'
            ) {

                return sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ⚠️ SETTINGS ERROR 〕━━⬣
┃
┃ Settings configuration
┃ is missing.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !settings.APIs ||
                typeof settings.APIs.neoxr !==
                    'string'
            ) {

                return sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ⚠️ API ERROR 〕━━⬣
┃
┃ Anime API is not
┃ configured properly.
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

                return sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ⚠️ API KEY ERROR 〕━━⬣
┃
┃ API key is missing.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 🌸 ANIME IMAGE 〕━━⬣
┃
┃ Fetching random anime
┃ image...
┃ Please wait.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const response =
                await axios.get(
`${settings.APIs.neoxr}/api/anime?apikey=${encodeURIComponent(settings.apiKey)}`,
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
                typeof response !==
                    'object'
            ) {

                return sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ API RESPONSE ERROR 〕━━⬣
┃
┃ Invalid response from API.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                response.status !== 200
            ) {

                return sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ Status: ${response.status}
┃ Failed to fetch image.
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

                return sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID DATA 〕━━⬣
┃
┃ API returned invalid data.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const imageUrl =
                typeof body.data ===
                    'string' &&
                body.data.startsWith(
                    'http'
                )
                    ? body.data
                    : null

            if (!imageUrl) {

                return sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ IMAGE NOT FOUND 〕━━⬣
┃
┃ No valid anime image
┃ was found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const caption =
`╭━━〔 🌸 ANIME IMAGE 〕━━⬣
┃
┃ 🖼 Random anime image
┃ generated successfully.
┃
┣━━〔 🤖 BOT INFO 〕━━⬣
┃ Prefix: ${prefix}
┃ Status: Active
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            try {

                await sock.sendMessage(
                    from,
                    {
                        image: {
                            url:
                                imageUrl
                        },

                        caption,

                        contextInfo: {
                            externalAdReply: {
                                title:
                                    settings.botName ||
                                    'Nox Sparrow Bot',

                                body:
                                    settings.ownerName ||
                                    'Powered By Nox',

                                thumbnailUrl:
                                    settings.botImage ||

                                    imageUrl,

                                sourceUrl:
                                    settings.repo ||

                                    'https://github.com',

                                mediaType: 1,

                                renderLargerThumbnail:
                                    true
                            }
                        }
                    }
                )

            } catch (sendError) {

                console.log(
                    'AnimePic Send Error:',
                    sendError
                )

                await sock.sendMessage(
                    from,
                    {
                        text:
`${caption}

🔗 ${imageUrl}`
                    }
                )
            }

        } catch (error) {

            console.log(
                'AnimePic Command Error:',
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
┃ anime image.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}