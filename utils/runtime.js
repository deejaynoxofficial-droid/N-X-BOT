const fs = require('fs')
const settings = require('../settings')
const { runtime } = require('../lib/functions')

module.exports = {
    name: 'runtime',

    async execute(sock, msg) {

        const from = msg.key.remoteJid

        try {

            const uptime = runtime(
                process.uptime()
            )

            const text = `
╭━━━〔 ⏰ BOT RUNTIME 〕━━━⬣
┃
┃ 🤖 Bot: ${settings.botName}
┃ ⚡ Runtime: ${uptime}
┃ ✅ Status: Running
┃ 🚀 Performance: Stable
┃
╰━━━━━━━━━━━━━━━━━━⬣

${settings.footer}
`

            // SEND IMAGE IF EXISTS
            if (
                settings.botImage &&
                fs.existsSync(settings.botImage)
            ) {

                await sock.sendMessage(from, {
                    image: fs.readFileSync(settings.botImage),
                    caption: text
                })

            } else {

                await sock.sendMessage(from, {
                    text
                })
            }

        } catch (error) {

            console.log(
                'Runtime Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text: '❌ Failed to check runtime.'
                })

            } catch {}
        }
    }
}