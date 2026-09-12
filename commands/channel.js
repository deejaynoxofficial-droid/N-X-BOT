const settings = require('../settings')

module.exports = {
    name: 'channel',
    aliases: ['whatsappchannel', 'wachannel'],
    category: 'main',
    description: 'Get the official NOX SPARROW WhatsApp channel',

    async execute(sock, msg) {
        const from = msg?.key?.remoteJid
        if (!from || !sock || typeof sock.sendMessage !== 'function') return

        const link = settings.channel
        await sock.sendMessage(from, {
            text: `╭━━〔 📢 NOX SPARROW CHANNEL 〕━━⬣\n┃\n┃ ⭐ Follow our official WhatsApp channel\n┃\n┃ 🔗 ${link}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━⬣\n\n© POWERED BY NOX STAR.B`
        })
    }
}
