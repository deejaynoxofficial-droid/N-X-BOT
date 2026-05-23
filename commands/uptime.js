const { runtime } = require('../lib/functions')

module.exports = {
    name: 'uptime',

    async execute(sock, msg) {

        const from =
            msg?.key?.remoteJid

        try {

            if (
                !from ||
                typeof from !== 'string'
            ) {
                return
            }

            const up =
                runtime(
                    process.uptime()
                )

            const text =
`╭━━〔 ⏰ SYSTEM UPTIME 〕━━⬣
┃
┃ 🤖 Bot Status: ONLINE
┃ ⚡ Uptime: ${up}
┃ 🚀 Performance: Stable
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(from, {
                text
            })

        } catch (error) {

            console.log(
                'Uptime Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
                        '❌ Failed to fetch uptime.'
                })

            } catch {}
        }
    }
}