module.exports = {
    name: 'gitclone',

    async execute(sock, msg, args) {

        const from = msg.key.remoteJid

        const url = args[0]

        if (!url) {
            return sock.sendMessage(from, {
                text: 'Example: .gitclone https://github.com/user/repo'
            })
        }

        // GITHUB CLONE DOWNLOADER HERE

        await sock.sendMessage(from, {
            text: 'Cloning Repository...'
        })
    }
}