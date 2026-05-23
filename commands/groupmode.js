module.exports = {
    name: 'groupmode',

    async execute(sock, msg, args) {

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
                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ GROUPMODE 〕━━⬣
┃
┃ This command only
┃ works in groups.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            const mode =
                args[0]
                    ?.trim()
                    ?.toLowerCase() || ''

            if (!mode) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 👥 GROUP MODE 〕━━⬣
┃
┃ Available Modes:
┃
┃ 🔓 open
┃ 🔒 close
┃
┃ Example:
┃ .groupmode open
┃ .groupmode close
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const validModes = [
                'open',
                'close'
            ]

            if (
                !validModes.includes(mode)
            ) {
                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ INVALID MODE 〕━━⬣
┃
┃ Use:
┃ .groupmode open
┃ .groupmode close
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
                typeof sender !== 'string'
            ) {
                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to detect
┃ command sender.
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
                    'Group Metadata Error:',
                    metadataError
                )

                return await sock.sendMessage(from, {
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
                typeof metadata !== 'object' ||
                !Array.isArray(
                    metadata.participants
                )
            ) {
                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Invalid group
┃ metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const participants =
                metadata.participants.filter(
                    member =>
                        member &&
                        typeof member ===
                            'object' &&
                        typeof member.id ===
                            'string'
                )

            const admins =
                participants
                    .filter(
                        member =>
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
                return await sock.sendMessage(from, {
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
                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ BOT NOT ADMIN 〕━━⬣
┃
┃ Bot must be admin
┃ to manage group mode.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (mode === 'open') {

                try {

                    await sock.groupSettingUpdate(
                        from,
                        'not_announcement'
                    )

                    return await sock.sendMessage(from, {
                        text:
`╭━━〔 🔓 GROUP OPENED 〕━━⬣
┃
┃ All members can now
┃ send messages.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })

                } catch (openError) {

                    console.log(
                        'Open Group Error:',
                        openError
                    )

                    return await sock.sendMessage(from, {
                        text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to open
┃ the group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }
            }

            if (mode === 'close') {

                try {

                    await sock.groupSettingUpdate(
                        from,
                        'announcement'
                    )

                    return await sock.sendMessage(from, {
                        text:
`╭━━〔 🔒 GROUP CLOSED 〕━━⬣
┃
┃ Only admins can now
┃ send messages.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })

                } catch (closeError) {

                    console.log(
                        'Close Group Error:',
                        closeError
                    )

                    return await sock.sendMessage(from, {
                        text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to close
┃ the group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }
            }

        } catch (error) {

            console.log(
                'GroupMode Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ groupmode command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}