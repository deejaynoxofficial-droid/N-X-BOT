let settings = {}

try {

    settings = require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'repo',

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

            const botName =
                typeof settings.botName ===
                    'string'
                    ? settings.botName
                    : 'NOX SPARROW BOT'

            const ownerName =
                typeof settings.ownerName ===
                    'string'
                    ? settings.ownerName
                    : 'Mr.Nox Star Bots'

            const repoLink =
'https://github.com/deejaynoxofficial-droid/N-X-BOT.git'

            const text =
`╭━━━〔 🤖 BOT REPOSITORY 〕━━━⬣
┃
┃ 📦 Repository:
┃ N-X-BOT
┃
┣━━━━━━━━━━━━━━━━⬣
┃
┃ 👑 Developer:
┃ ${ownerName}
┃
┃ 🤖 Bot Name:
┃ ${botName}
┃
┣━━━━━━━━━━━━━━━━⬣
┃
┃ 🔗 GitHub Repository:
┃ ${repoLink}
┃
┣━━━━━━━━━━━━━━━━⬣
┃
┃ ⭐ Fork & Star
┃ the repository
┃ to support development.
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(from, {
                text
            })

        } catch (error) {

            console.log(
                'Repo Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ COMMAND ERROR 〕━━━⬣
┃
┃ Failed to fetch
┃ repository information.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}