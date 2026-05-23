const axios = require('axios')

let settings = {}

try {

    settings = require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'mediafire',

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

            const input =
                args[0]?.trim()

            if (!input) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 📦 MEDIAFIRE DOWNLOADER 〕━━⬣
┃
┃ 📌 Usage:
┃ .mediafire https://www.mediafire.com/file/xxxx
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            let parsedUrl

            try {

                parsedUrl =
                    new URL(input)

            } catch {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID URL 〕━━⬣
┃
┃ Please provide a valid
┃ MediaFire download link.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const validHosts = [

                'mediafire.com',
                'www.mediafire.com',
                'm.mediafire.com'
            ]

            if (
                !validHosts.includes(
                    parsedUrl.hostname
                )
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID LINK 〕━━⬣
┃
┃ Only MediaFire links
┃ are supported.
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
┃ MediaFire API is not
┃ configured correctly.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 📥 DOWNLOADING 〕━━⬣
┃
┃ Processing MediaFire link...
┃ Please wait a moment.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const apiUrl =
`${settings.APIs.neoxr}/api/mediafire?url=${encodeURIComponent(input)}&apikey=${encodeURIComponent(settings.apiKey)}`

            const response =
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
┃ Failed to fetch file.
┃ Status: ${response?.status || 'Unknown'}
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

            const data =
                body.data || body.result

            if (
                !data ||
                typeof data !== 'object'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ FILE NOT FOUND 〕━━⬣
┃
┃ No downloadable file
┃ was found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const fileName =
                typeof data.filename ===
                    'string' &&
                data.filename.trim()
                    ? data.filename.trim()
                    : 'mediafire-file'

            const fileSize =
                typeof data.size ===
                    'string'
                    ? data.size
                    : 'Unknown'

            const mimeType =
                typeof data.mimetype ===
                    'string'
                    ? data.mimetype
                    : 'application/octet-stream'

            const downloadUrl =
                data.url ||
                data.link ||
                data.download

            if (
                !downloadUrl ||
                typeof downloadUrl !==
                    'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ DOWNLOAD ERROR 〕━━⬣
┃
┃ Download URL was not found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const caption =
`╭━━〔 📦 MEDIAFIRE FILE 〕━━⬣
┃
┃ 📄 Name:
┃ ${fileName}
┃
┃ 📏 Size:
┃ ${fileSize}
┃
┃ ✅ Status:
┃ Download completed
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            try {

                await sock.sendMessage(from, {
                    document: {
                        url: downloadUrl
                    },

                    fileName,

                    mimetype:
                        mimeType,

                    caption
                })

            } catch (sendError) {

                console.log(
                    'Document Send Error:',
                    sendError
                )

                await sock.sendMessage(from, {
                    text:
`╭━━〔 📦 FILE READY 〕━━⬣
┃
┃ 📄 ${fileName}
┃ 📏 ${fileSize}
┃
┃ 🔗 Download:
┃ ${downloadUrl}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

        } catch (error) {

            console.log(
                'MediaFire Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ COMMAND ERROR 〕━━⬣
┃
┃ Failed to process
┃ MediaFire link.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}