module.exports = {

    name: 'ping',

    aliases: ['test'],

    async execute(sock, msg) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: '🏓 Pong working'
            },
            {
                quoted: msg
            }
        )
    }
}
