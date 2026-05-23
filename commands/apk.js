const axios = require('axios')

module.exports = {
    name: 'apk',

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
`╭━━〔 📦 APK SEARCH 〕━━⬣
┃
┃ 📌 Usage:
┃ .apk WhatsApp
┃ .apk Telegram
┃ .apk Spotify
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

            const blockedWords = [

                'hack',
                'mod',
                'crack',
                'premium',
                'cheat',
                'injector',
                'bypass',
                'malware',
                'virus',
                'spy',
                'stealer'
            ]

            const lowerQuery =
                query.toLowerCase()

            const containsBlocked =
                blockedWords.some(
                    word =>
                        lowerQuery.includes(
                            word
                        )
                )

            if (
                containsBlocked
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 🚫 BLOCKED REQUEST 〕━━⬣
┃
┃ Unsafe APK requests
┃ are not allowed.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 🔎 SEARCHING APK 〕━━⬣
┃
┃ Searching application...
┃ Please wait.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            let response = null

            try {

                response =
                    await axios.get(
                        `https://api.api-ninjas.com/v1/apk?name=${encodeURIComponent(query)}`,
                        {
                            timeout: 20000,

                            validateStatus:
                                status =>
                                    status >= 200 &&
                                    status < 500,

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
                    'APK API Error:',
                    apiError
                )

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ CONNECTION ERROR 〕━━⬣
┃
┃ Failed to connect
┃ to APK service.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !response ||
                typeof response !==
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

            if (
                response.status !== 200
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ APK service is currently
┃ unavailable.
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
`╭━━〔 ❌ MALFORMED DATA 〕━━⬣
┃
┃ Invalid APK response.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const apps =
                Array.isArray(body)
                    ? body
                    : Array.isArray(body.data)
                    ? body.data
                    : []

            if (
                apps.length === 0
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ NO RESULTS 〕━━⬣
┃
┃ No APK applications
┃ were found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const app =
                apps[0]

            if (
                !app ||
                typeof app !==
                    'object'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID APK 〕━━⬣
┃
┃ Failed to process
┃ APK information.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const appName =
                typeof app.name ===
                    'string' &&
                app.name.trim() !== ''
                    ? app.name.trim()
                    : 'Unknown'

            const developer =
                typeof app.publisher ===
                    'string' &&
                app.publisher.trim() !== ''
                    ? app.publisher.trim()
                    : 'Unknown'

            const version =
                typeof app.version ===
                    'string' &&
                app.version.trim() !== ''
                    ? app.version.trim()
                    : 'Unknown'

            const size =
                typeof app.size ===
                    'string' &&
                app.size.trim() !== ''
                    ? app.size.trim()
                    : 'Unknown'

            const downloadUrl =
                typeof app.download_url ===
                    'string' &&
                app.download_url.startsWith(
                    'http'
                )
                    ? app.download_url
                    : null

            const icon =
                typeof app.icon ===
                    'string' &&
                app.icon.startsWith(
                    'http'
                )
                    ? app.icon
                    : null

            const caption =
`╭━━〔 📦 APK RESULT 〕━━⬣
┃
┃ 📱 Name:
┃ ${appName}
┃
┃ 👨‍💻 Developer:
┃ ${developer}
┃
┃ 🆕 Version:
┃ ${version}
┃
┃ 💾 Size:
┃ ${size}
┃
┃ 🔗 Download:
┃ ${downloadUrl || 'Unavailable'}
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            if (icon) {

                try {

                    await sock.sendMessage(
                        from,
                        {
                            image: {
                                url: icon
                            },

                            caption
                        }
                    )

                    return

                } catch (imageError) {

                    console.log(
                        'APK Image Error:',
                        imageError
                    )
                }
            }

            await sock.sendMessage(from, {
                text:
                    caption
            })

        } catch (error) {

            console.log(
                'APK Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ COMMAND ERROR 〕━━⬣
┃
┃ Failed to execute
┃ apk command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}