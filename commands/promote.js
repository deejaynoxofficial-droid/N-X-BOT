module.exports = {
    name: 'promote',

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
                typeof sock.groupParticipantsUpdate !==
                    'function' ||
                typeof sock.groupMetadata !==
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

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ GROUP ONLY 〕━━⬣
┃
┃ This command can only
┃ be used in groups.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const sender =
                msg?.key?.participant ||
                msg?.participant ||
                null

            if (
                !sender ||
                typeof sender !== 'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to detect
┃ command sender.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const quoted =
                msg?.message
                    ?.extendedTextMessage
                    ?.contextInfo || null

            const target =
                quoted?.participant || null

            if (
                !target ||
                typeof target !== 'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 👑 PROMOTE COMMAND 〕━━⬣
┃
┃ Reply to the user
┃ you want to promote.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
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

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ GROUP ERROR 〕━━⬣
┃
┃ Failed to fetch
┃ group metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !metadata ||
                !Array.isArray(
                    metadata.participants
                )
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID GROUP 〕━━⬣
┃
┃ Unable to load
┃ group participants.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const participants =
                metadata.participants

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

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ADMIN ONLY 〕━━⬣
┃
┃ Only group admins
┃ can use this command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (!isBotAdmin) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ BOT NOT ADMIN 〕━━⬣
┃
┃ Promote the bot
┃ to admin first.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const userExists =
                participants.some(
                    member =>
                        member.id === target
                )

            if (!userExists) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ USER NOT FOUND 〕━━⬣
┃
┃ User is not inside
┃ this group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const alreadyAdmin =
                admins.includes(target)

            if (alreadyAdmin) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ⚠️ ALREADY ADMIN 〕━━⬣
┃
┃ This user is already
┃ a group admin.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (target === normalizedBot) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID ACTION 〕━━⬣
┃
┃ I cannot promote
┃ myself.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 ⏳ PROMOTING USER 〕━━⬣
┃
┃ Promoting member
┃ to admin...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            try {

                await sock.groupParticipantsUpdate(
                    from,
                    [target],
                    'promote'
                )

            } catch (promoteError) {

                console.log(
                    'Promote Error:',
                    promoteError
                )

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ PROMOTION FAILED 〕━━⬣
┃
┃ Failed to promote
┃ group member.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(
                from,
                {
                    text:
`╭━━〔 ✅ USER PROMOTED 〕━━⬣
┃
┃ 👤 User:
┃ @${target.split('@')[0]}
┃
┃ 👑 Successfully promoted
┃ to group admin.
┃
╰━━━━━━━━━━━━━━━━━━⬣`,
                    mentions: [target]
                }
            )

        } catch (error) {

            console.log(
                'Promote Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ COMMAND ERROR 〕━━⬣
┃
┃ Failed to execute
┃ promote command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}