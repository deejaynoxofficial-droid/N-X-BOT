const axios = require('axios')
const fs = require('fs')
const settings = require('../settings')

module.exports = {
    name: 'weather',

    async execute(sock, msg, args) {

        const from = msg.key.remoteJid

        try {

            const query =
                args.join(' ').trim()

            if (!query) {

                return await sock.sendMessage(from, {
                    text:
`╭━━━〔 🌦 WEATHER SEARCH 〕━━━⬣
┃
┃ Usage:
┃ .weather city
┃
┃ Example:
┃ .weather kampala
┃ .weather london
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            // WAIT MESSAGE
            await sock.sendMessage(from, {
                text: '🌍 Checking weather...'
            })

            // API REQUEST
            const response =
                await axios.get(

`${settings.APIs.neoxr}/api/weather?q=${encodeURIComponent(query)}&apikey=${settings.apiKey}`

                )

            const data =
                response.data.data

            if (!data) {

                return await sock.sendMessage(from, {
                    text: '❌ Weather data not found.'
                })
            }

            const weather =
`╭━━━〔 🌦 WEATHER INFO 〕━━━⬣
┃
┃ 🌍 City: ${data.city}
┃ 🌡 Temperature: ${data.temperature}
┃ ☁ Weather: ${data.description}
┃ 💧 Humidity: ${data.humidity}
┃ 🌬 Wind Speed: ${data.wind_speed}
┃
╰━━━━━━━━━━━━━━━━━━⬣

${settings.footer}`

            // SEND WITH IMAGE
            if (
                settings.botImage &&
                fs.existsSync(settings.botImage)
            ) {

                await sock.sendMessage(from, {
                    image: fs.readFileSync(settings.botImage),
                    caption: weather
                })

            } else {

                await sock.sendMessage(from, {
                    text: weather
                })
            }

        } catch (error) {

            console.log(
                'Weather Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text:
                            '❌ Failed to fetch weather data.'
                    }
                )

            } catch {}
        }
    }
}