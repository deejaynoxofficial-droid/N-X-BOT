module.exports = {
    name: 'demote',

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
                typeof sock.groupParticipantsUpdate !==
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
┃ be used inside groups.
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

            const contextInfo =
                msg?.message
                    ?.extendedTextMessage
                    ?.contextInfo || null

            let target = null

            if (
                typeof contextInfo?.participant ===
                    'string'
            ) {

                target =
                    contextInfo.participant

            } else if (
                Array.isArray(
                    contextInfo?.mentionedJid
                ) &&
                contextInfo.mentionedJid.length > 0
            ) {

                target =
                    contextInfo
                        .mentionedJid[0]
            }

            if (
                !target ||
                typeof target !== 'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 👑 DEMOTE COMMAND 〕━━⬣
┃
┃ Reply to or mention
┃ an admin to demote.
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

            const isSenderAdmin =
                admins.includes(
                    normalizedSender
                )

            const isBotAdmin =
                admins.includes(
                    normalizedBot
                )

            if (!isSenderAdmin) {

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

            const targetExists =
                participants.some(
                    member =>
                        member.id === target
                )

            if (!targetExists) {

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

            const isTargetAdmin =
                admins.includes(target)

            if (!isTargetAdmin) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ NOT ADMIN 〕━━⬣
┃
┃ This user is not
┃ a group admin.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                target === normalizedBot
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID ACTION 〕━━⬣
┃
┃ I cannot demote
┃ myself.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                target === normalizedSender
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID ACTION 〕━━⬣
┃
┃ You cannot demote
┃ yourself.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 ⏳ DEMOTING USER 〕━━⬣
┃
┃ Removing admin
┃ privileges...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            try {

                await sock.groupParticipantsUpdate(
                    from,
                    [target],
                    'demote'
                )

            } catch (updateError) {

                console.log(
                    'Demote Update Error:',
                    updateError
                )

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ DEMOTION FAILED 〕━━⬣
┃
┃ Failed to demote
┃ group admin.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(
                from,
                {
                    text:
`╭━━〔 ✅ USER DEMOTED 〕━━⬣
┃
┃ 👤 User:
┃ @${target.split('@')[0]}
┃
┃ 📉 Admin privileges
┃ removed successfully.
┃
╰━━━━━━━━━━━━━━━━━━⬣`,
                    mentions: [target]
                }
            )

        } catch (error) {

            console.log(
                'Demote Command Error:',
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
┃ demote command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}