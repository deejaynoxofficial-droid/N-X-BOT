let settings = {}

try {

    settings = require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'owner',

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

            const ownerNumber =
                typeof settings.ownerNumber ===
                    'string'
                    ? settings.ownerNumber
                    : '256700000000'

            const ownerName =
                typeof settings.ownerName ===
                    'string'
                    ? settings.ownerName
                    : 'NOX OWNER'

            const botName =
                typeof settings.botName ===
                    'string'
                    ? settings.botName
                    : 'NOX SPARROW BOT'

            const ownerEmoji =
                typeof settings.ownerEmoji ===
                    'string'
                    ? settings.ownerEmoji
                    : '👑'

            if (
                !ownerNumber ||
                ownerNumber.trim() === ''
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ OWNER ERROR 〕━━━⬣
┃
┃ Owner number is missing.
┃ Check settings.js file.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const jid =
`${ownerNumber}@s.whatsapp.net`

            let detectedName =
                ownerName

            try {

                const contact =
                    await sock.onWhatsApp(
                        jid
                    )

                if (
                    Array.isArray(contact) &&
                    contact.length > 0
                ) {

                    detectedName =
                        contact[0].notify ||
                        ownerName
                }

            } catch (contactError) {

                console.log(
                    'Owner Contact Error:',
                    contactError
                )
            }

            const text =
`╭━━━〔 ${ownerEmoji} OWNER PANEL 〕━━━⬣
┃
┃ 🤖 Bot:
┃ ${botName}
┃
┣━━━━━━━━━━━━━━━━⬣
┃
┃ 👤 Owner Name:
┃ ${detectedName}
┃
┃ 📱 WhatsApp:
┃ wa.me/${ownerNumber}
┃
┃ ⚡ Status:
┃ ACTIVE & ONLINE
┃
┃ 🔰 Role:
┃ 𝙼𝚛.𝙽𝙾𝚇𝚂𝚃𝙰𝚁 𝙱𝙾𝚃𝚂
┃
┣━━━━━━━━━━━━━━━━⬣
┃
┃ 💬 Contact Owner
┃ for support or help.
┃ +256748752152
╰━━━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(from, {
                text,
                mentions: [jid]
            })

        } catch (error) {

            console.log(
                'Owner Command Error:',
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
┃ owner information.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}