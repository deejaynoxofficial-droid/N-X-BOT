const fs = require('fs')
const path = require('path')

module.exports = async function antiDelete(sock, update) {

    try {

        const msg =
            update?.messages?.[0]

        if (!msg) return

        if (!msg.message) return

        // ========================================
        // STORE MESSAGE IN MEMORY
        // ========================================

        if (!global.store) {
            global.store = new Map()
        }

        const id = msg.key.id
        const from = msg.key.remoteJid

        global.store.set(id, {
            msg,
            from,
            time: Date.now()
        })

        // ========================================
        // DETECT DELETED MESSAGE
        // ========================================

        if (
            update.type === 'notify' &&
            update.messages?.[0]?.message?.protocolMessage
        ) {

            const deleted =
                update.messages[0].message.protocolMessage

            const key = deleted.key?.id

            const saved = global.store.get(key)

            if (!saved) return

            const original = saved.msg

            const chat = saved.from

            // ========================================
            // TEXT MESSAGE RESTORE
            // ========================================

            const text =
                original.message?.conversation ||
                original.message?.extendedTextMessage?.text ||
                ''

            if (text) {

                return await sock.sendMessage(chat, {
                    text: `🚫 *DELETED MESSAGE RECOVERED*\n\n💬 ${text}`
                })
            }

            // ========================================
            // IMAGE RESTORE
            // ========================================

            const image =
                original.message?.imageMessage

            if (image) {

                const buffer =
                    await sock.downloadMediaMessage(original)

                return await sock.sendMessage(chat, {
                    image: buffer,
                    caption: '🚫 Deleted Image Recovered'
                })
            }

            // ========================================
            // VIDEO RESTORE
            // ========================================

            const video =
                original.message?.videoMessage

            if (video) {

                const buffer =
                    await sock.downloadMediaMessage(original)

                return await sock.sendMessage(chat, {
                    video: buffer,
                    caption: '🚫 Deleted Video Recovered'
                })
            }

            // ========================================
            // AUDIO RESTORE
            // ========================================

            const audio =
                original.message?.audioMessage

            if (audio) {

                const buffer =
                    await sock.downloadMediaMessage(original)

                return await sock.sendMessage(chat, {
                    audio: buffer,
                    mimetype: 'audio/mp4'
                })
            }
        }

    } catch (err) {
        console.log('ANTI-DELETE ERROR:', err)
    }
}
