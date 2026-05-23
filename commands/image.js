module.exports = {

    name: 'image',

    aliases: ['img'],

    async execute(
        sock,
        msg,
        args
    ) {

        const from =
            msg.key.remoteJid

        try {

            await sock.sendMessage(
                from,
                {
                    text:
                        '🖼️ Image command is under maintenance.'
                }
            )

        } catch (err) {

            console.log(err)
        }
    }
}
