const { runtime } = require('../utils/functions')

module.exports = {
    name: 'ping',

    async execute(sock, msg) {

        const from = msg.key.remoteJid

        try {

            const start = process.hrtime()

            await sock.sendMessage(from, {
                text: '🏓 Checking bot speed...'
            })

            const end = process.hrtime(start)

            const speed =
                (
                    end[0] * 1000 +
                    end[1] / 1000000
                ).toFixed(2)

            const text = `
╭━━━〔 🏓 PING STATUS 〕━━━⬣
┃
┃ ⚡ Speed: ${speed} ms
┃ 🕒 Runtime: ${runtime(process.uptime())}
┃ 🤖 Status: Online
┃ 🚀 Performance: Stable
┃
╰━━━━━━━━━━━━━━━━━━⬣
`

            await sock.sendMessage(from, {
                text
            })

        } catch (error) {

            console.log(
                'Ping Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text: '❌ Failed to check ping.'
                })

            } catch {}
        }
    }
}
