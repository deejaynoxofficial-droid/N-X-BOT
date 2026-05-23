module.exports = {
    name: 'mute',

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
                    'function' ||
                typeof sock.groupMetadata !==
                    'function' ||
                typeof sock.groupSettingUpdate !==
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

            if (
                !from.endsWith('@g.us')
            ) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 🔇 MUTE COMMAND 〕━━⬣
┃
┃ This command only
┃ works in groups.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const sender =
                msg?.key?.participant ||
                msg?.participant ||
                null

            if (
                !sender ||
                typeof sender !==
                    'string'
            ) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Unable to detect
┃ sender.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            let metadata = null

            try {

                metadata =
                    await sock.groupMetadata(
                        from
                    )

            } catch (metadataError) {

                console.log(
                    'Metadata Error:',
                    metadataError
                )

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to fetch
┃ group metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                !metadata ||
                !Array.isArray(
                    metadata.participants
                )
            ) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Invalid group
┃ metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const admins =
                metadata.participants
                    .filter(
                        member =>
                            member &&
                            member.admin
                    )
                    .map(
                        member =>
                            member.id
                    )

            const normalizedSender =
                sender.includes(':')
                    ? sender.split(':')[0] +
                      '@s.whatsapp.net'
                    : sender

            const rawBotId =
                sock?.user?.id || ''

            const normalizedBot =
                rawBotId.includes(':')
                    ? rawBotId.split(':')[0] +
                      '@s.whatsapp.net'
                    : rawBotId

            const isAdmin =
                admins.includes(
                    normalizedSender
                )

            const isBotAdmin =
                admins.includes(
                    normalizedBot
                )

            if (!isAdmin) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ACCESS DENIED 〕━━⬣
┃
┃ Only group admins
┃ can use this command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (!isBotAdmin) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ BOT ADMIN REQUIRED 〕━━⬣
┃
┃ Bot must be admin
┃ to mute the group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            try {

                await sock.groupSettingUpdate(
                    from,
                    'announcement'
                )

            } catch (updateError) {

                console.log(
                    'Mute Update Error:',
                    updateError
                )

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to mute
┃ the group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 🔇 GROUP MUTED 〕━━⬣
┃
┃ Group has been
┃ muted successfully.
┃
┃ Only admins can
┃ send messages now.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

        } catch (error) {

            console.log(
                'Mute Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ mute command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}