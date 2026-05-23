module.exports = {
    name: 'kick',

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
`╭━━〔 👢 KICK COMMAND 〕━━⬣
┃
┃ Reply to a group member
┃ to remove them.
┃
┃ Example:
┃ Reply + .kick
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 👢 KICKING MEMBER 〕━━⬣
┃
┃ Removing selected member...
┃ Please wait.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const metadata =
                await sock.groupMetadata(from)
                    .catch(() => null)

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
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to fetch
┃ group metadata.
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
                            member &&
                            member.admin
                    )
                    .map(
                        member => member.id
                    )

            const botNumber =
                sock.user?.id
                    ?.split(':')[0]
                    ?.trim() +
                '@s.whatsapp.net'

            if (
                !botNumber ||
                typeof botNumber !==
                    'string'
            ) {
                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to detect
┃ bot account.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const isSenderAdmin =
                admins.includes(sender)

            const isBotAdmin =
                admins.includes(botNumber)

            if (
                !isSenderAdmin
            ) {
                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ACCESS DENIED 〕━━⬣
┃
┃ Only group admins
┃ can use this command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !isBotAdmin
            ) {
                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ BOT NOT ADMIN 〕━━⬣
┃
┃ Promote the bot to admin
┃ before using this command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                target === botNumber
            ) {
                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID ACTION 〕━━⬣
┃
┃ I cannot remove myself.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                target === sender
            ) {
                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID ACTION 〕━━⬣
┃
┃ You cannot remove
┃ yourself from the group.
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

            if (
                !targetExists
            ) {
                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ USER NOT FOUND 〕━━⬣
┃
┃ Selected user is not
┃ in this group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const isTargetAdmin =
                admins.includes(target)

            if (
                isTargetAdmin
            ) {
                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ACTION BLOCKED 〕━━⬣
┃
┃ Cannot remove another
┃ group admin.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.groupParticipantsUpdate(
                from,
                [target],
                'remove'
            )

            await sock.sendMessage(from, {
                text:
`╭━━〔 ✅ MEMBER REMOVED 〕━━⬣
┃
┃ 👤 User:
┃ @${target.split('@')[0]}
┃
┃ has been removed
┃ from the group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`,
                mentions: [target]
            })

        } catch (error) {

            console.log(
                'Kick Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to remove
┃ group member.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}