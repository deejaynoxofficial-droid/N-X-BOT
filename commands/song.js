const axios = require('axios')
const settings = require('../settings')

module.exports = {
    name: 'song',

    async execute(sock, msg, args) {

        const from = msg.key.remoteJid

        try {

            const query =
                args.join(' ').trim()

            if (!query) {

                return await sock.sendMessage(from, {
                    text:
`╭━━━〔 🎵 SONG SEARCH 〕━━━⬣
┃
┃ Usage:
┃ .song song name
┃
┃ Example:
┃ .song faded
┃ .song believer
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            // WAIT MESSAGE
            await sock.sendMessage(from, {
                text: '🎧 Searching song...'
            })

            // SEARCH SONG
            const response =
                await axios.get(

`${settings.APIs.neoxr}/api/youtube-search?q=${encodeURIComponent(query)}&apikey=${settings.apiKey}`

                )

            const data =
                response.data.result[0]

            if (!data) {

                return await sock.sendMessage(from, {
                    text: '❌ Song not found.'
                })
            }

            const caption =
`╭━━━〔 🎵 SONG FOUND 〕━━━⬣
┃
┃ 📌 Title: ${data.title}
┃ ⏱ Duration: ${data.duration}
┃ 👀 Views: ${data.views}
┃ 📅 Uploaded: ${data.upload}
┃
╰━━━━━━━━━━━━━━━━━━⬣

🔗 ${data.url}

${settings.footer}`

            // SEND THUMBNAIL
            await sock.sendMessage(from, {
                image: {
                    url: data.thumbnail
                },
                caption
            })

            // AUDIO DOWNLOAD
            const audioResponse =
                await axios.get(

`${settings.APIs.neoxr}/api/youtube-audio?url=${data.url}&apikey=${settings.apiKey}`

                )

            const audioUrl =
                audioResponse.data.result.url

            // SEND AUDIO
            await sock.sendMessage(from, {
                audio: {
                    url: audioUrl
                },
                mimetype: 'audio/mpeg',
                fileName: `${data.title}.mp3`
            })

        } catch (error) {

            console.log(
                'Song Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text:
                            '❌ Failed to fetch song.'
                    }
                )

            } catch {}
        }
    }
}