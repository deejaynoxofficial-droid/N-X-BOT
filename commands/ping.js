module.exports = {

    name: 'ping',

    aliases: ['speed'],

    category: 'main',

    description: 'Check bot speed',

    async execute(sock, msg) {

        try {

            if (!sock || !msg) return

            const from =
                msg.key?.remoteJid

            if (!from) return

            //========================================
            // RUNTIME FUNCTION
            //========================================

            function runtime(seconds) {

                seconds = Number(seconds)

                const d =
                    Math.floor(
                        seconds / (3600 * 24)
                    )

                const h =
                    Math.floor(
                        seconds % (3600 * 24) / 3600
                    )

                const m =
                    Math.floor(
                        seconds % 3600 / 60
                    )

                const s =
                    Math.floor(
                        seconds % 60
                    )

                return (
                    `${d}d ${h}h ${m}m ${s}s`
                )
            }

            //========================================
            // SPEED TEST
            //========================================

            const start =
                process.hrtime()

            await sock.sendMessage(
                from,
                {
                    text:
                        '🏓 Checking bot speed...'
                },
                {
                    quoted: msg
                }
            )

            const end =
                process.hrtime(start)

            const speed =
                (
                    end[0] * 1000 +
                    end[1] / 1000000
                ).toFixed(2)

            //========================================
            // MESSAGE
            //========================================

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

            await sock.sendMessage(
                from,
                {
                    text
                },
                {
                    quoted: msg
                }
            )

            console.log(
                `✅ PING USED`
            )

        } catch (error) {

            console.log(
                '❌ PING ERROR:'
            )

            console.log(error)

            try {

                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text:
                            '❌ Failed to check ping.'
                    }
                )

            } catch {}
        }
    }
}
