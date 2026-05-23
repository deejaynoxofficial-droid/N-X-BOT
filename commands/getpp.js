module.exports = {
    name: 'getpp',

    async execute(sock, msg) {

        const from =
            msg?.key?.remoteJid || null

        try {

            if (
                !sock ||
                typeof sock !== 'object'
            ) {
                return
            }

            if (
                typeof sock.sendMessage !==
                    'function'
            ) {
                return
            }

            if (
                !from ||
                typeof from !== 'string'
            ) {
                return
            }

            let target = null

            const contextInfo =
                msg?.message
                    ?.extendedTextMessage
                    ?.contextInfo || null

            const quotedParticipant =
                contextInfo?.participant || null

            const mentionedJid =
                Array.isArray(
                    contextInfo?.mentionedJid
                )
                    ? contextInfo.mentionedJid
                    : []

            if (
                quotedParticipant &&
                typeof quotedParticipant ===
                    'string'
            ) {

                target =
                    quotedParticipant

            } else if (
                mentionedJid.length > 0 &&
                typeof mentionedJid[0] ===
                    'string'
            ) {

                target =
                    mentionedJid[0]

            } else if (
                typeof msg?.key
                    ?.participant ===
                'string'
            ) {

                target =
                    msg.key.participant

            } else if (
                typeof msg?.participant ===
                'string'
            ) {

                target =
                    msg.participant

            } else if (
                typeof from === 'string' &&
                !from.endsWith('@g.us')
            ) {

                target = from
            }

            if (
                !target ||
                typeof target !== 'string'
            ) {
                return sock.sendMessage(from, {
                    text:
                        'Reply to or mention a user.'
                })
            }

            if (
                !target.includes('@')
            ) {
                return sock.sendMessage(from, {
                    text:
                        'Invalid target user.'
                })
            }

            let profilePicture = null

            try {

                profilePicture =
                    await sock.profilePictureUrl(
                        target,
                        'image'
                    )

            } catch {

                profilePicture =
                    'https://i.imgur.com/8PT6F6B.png'
            }

            const username =
                target.split('@')[0]

            const caption =
`╭━━〔 🖼 USER PROFILE PICTURE 〕━━⬣
┃
┃ 👤 User: @${username}
┃ 📸 Profile picture fetched
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(from, {
                image: {
                    url:
                        profilePicture
                },
                caption,
                mentions: [target]
            })

        } catch (error) {

            console.log(
                'GetPP Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
                        'Failed to fetch profile picture.'
                })

            } catch {}
        }
    }
}