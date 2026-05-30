const {
    downloadMediaMessage
} = require('@whiskeysockets/baileys')

const settings =
    require('../settings')

module.exports = async (
    sock,
    messages
) => {

    try {

        if (
            !global.autoViewOnceEnabled
        ) {
            return
        }

        const msg =
            messages?.[0]

        if (
            !msg ||
            !msg.message
        ) {
            return
        }

        const viewOnce =

            msg.message?.viewOnceMessage ||

            msg.message?.viewOnceMessageV2 ||

            msg.message?.viewOnceMessageV2Extension

        if (!viewOnce) {
            return
        }

        const owner =
            `${settings.ownerNumber}@s.whatsapp.net`

        const mode =
            global.autoViewOnceMode ||
            'private'

        const target =
            mode === 'chat'
                ? msg.key.remoteJid
                : owner

        const sender =
            msg.key.participant ||
            msg.key.remoteJid

        const mediaMessage =
            viewOnce.message

        if (!mediaMessage) {
            return
        }

        await sock.sendMessage(
            target,
            {
                text:
`╭━━〔 👁️ VIEW ONCE DETECTED 〕━━⬣
┃
┃ Sender:
┃ ${sender}
┃
┃ Capturing media...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            }
        )

        const buffer =
            await downloadMediaMessage(
                msg,
                'buffer',
                {},
                {
                    logger: undefined,
                    reuploadRequest:
                        sock.updateMediaMessage
                }
            )

        if (!buffer) {
            return
        }

        if (
            mediaMessage.imageMessage
        ) {

            await sock.sendMessage(
                target,
                {
                    image: buffer,
                    caption:
                        mediaMessage
                            .imageMessage
                            ?.caption ||
                        'Captured View Once Image'
                }
            )
        }

        else if (
            mediaMessage.videoMessage
        ) {

            await sock.sendMessage(
                target,
                {
                    video: buffer,
                    caption:
                        mediaMessage
                            .videoMessage
                            ?.caption ||
                        'Captured View Once Video'
                }
            )
        }

        else if (
            mediaMessage.audioMessage
        ) {

            await sock.sendMessage(
                target,
                {
                    audio: buffer,
                    mimetype:
                        'audio/mp4',
                    ptt: false
                }
            )
        }

    } catch (err) {

        console.log(
            'AUTO VIEWONCE ERROR:'
        )

        console.log(err)
    }
}
