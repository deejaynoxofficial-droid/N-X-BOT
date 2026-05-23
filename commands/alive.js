const os = require('os')
const fs = require('fs')
const settings = require('../settings')
const { runtime } = require('../lib/functions')

module.exports = {
    name: 'alive',

    async execute(sock, msg) {

        const from = msg.key.remoteJid

        try {

            const ramUsed =
                (
                    process.memoryUsage().heapUsed /
                    1024 /
                    1024
                ).toFixed(2)

            const totalRam =
                (
                    os.totalmem() /
                    1024 /
                    1024 /
                    1024
                ).toFixed(2)

            const response = `
╭━━━〔 🤖 BOT STATUS 〕━━━⬣
┃
┃ ✅ Status: ONLINE
┃ ⚡ Runtime: ${runtime(process.uptime())}
┃ 💾 RAM Usage: ${ramUsed} MB
┃ 🧠 Total RAM: ${totalRam} GB
┃ 🖥️ Platform: ${os.platform()}
┃ 📦 Version: v1.0.0
┃ 👑 Owner: ${settings.ownerName}
┃
╰━━━━━━━━━━━━━━━━━━⬣

${settings.footer}
`

            // SEND WITH IMAGE
            if (
                settings.botImage &&
                fs.existsSync(settings.botImage)
            ) {

                await sock.sendMessage(from, {
                    image: fs.readFileSync(settings.botImage),
                    caption: response
                })

            } else {

                await sock.sendMessage(from, {
                    text: response
                })
            }

        } catch (error) {

            console.log(
                'Alive Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text: '❌ Failed to execute alive command.'
                })

            } catch {}
        }
    }
}