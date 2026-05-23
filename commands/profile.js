module.exports = {
    name: 'profile',

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

            const jid =
                msg.key.participant ||
                msg.key.remoteJid

            const user =
                jid.includes('@s.whatsapp.net')
                    ? jid
                    : sock.user.id

            const pushName =
                typeof msg.pushName === 'string' &&
                msg.pushName.trim() !== ''
                    ? msg.pushName
                    : 'Unknown User'

            let bio =
                'No bio available'

            try {

                const status =
                    await sock.fetchStatus(user)

                if (
                    status &&
                    typeof status.status ===
                        'string' &&
                    status.status.trim() !== ''
                ) {

                    bio =
                        status.status
                }

            } catch (statusError) {

                console.log(
                    'Profile Status Error:',
                    statusError
                )
            }

            let profilePicture =
                null

            try {

                profilePicture =
                    await sock.profilePictureUrl(
                        user,
                        'image'
                    )

            } catch {}

            const text =
`╭━━〔 👤 USER PROFILE 〕━━⬣
┃
┃ 🧑 Name: ${pushName}
┃ 📱 Number: ${user.split('@')[0]}
┃ 💬 Bio: ${bio}
┃ 🤖 Status: Active
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            try {

                if (
                    profilePicture &&
                    typeof profilePicture ===
                        'string'
                ) {

                    await sock.sendMessage(from, {
                        image: {
                            url: profilePicture
                        },
                        caption: text
                    })

                } else {

                    await sock.sendMessage(from, {
                        text
                    })
                }

            } catch (sendError) {

                console.log(
                    'Profile Send Error:',
                    sendError
                )

                await sock.sendMessage(from, {
                    text
                })
            }

        } catch (error) {

            console.log(
                'Profile Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
                        '❌ Failed to fetch profile.'
                })

            } catch {}
        }
    }
}