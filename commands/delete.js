module.exports = {
    name: 'delete',

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
                    'function'
            ) {
                return
            }

            if (
                !from ||
                typeof from !==
                    'string'
            ) {
                return
            }

            const contextInfo =
                msg?.message
                    ?.extendedTextMessage
                    ?.contextInfo || null

            const quotedMessageId =
                contextInfo?.stanzaId || null

            const quotedParticipant =
                contextInfo?.participant ||
                null

            if (
                !quotedMessageId ||
                typeof quotedMessageId !==
                    'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ DELETE ERROR 〕━━⬣
┃
┃ Reply to a message
┃ to delete it.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !quotedParticipant ||
                typeof quotedParticipant !==
                    'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ DELETE ERROR 〕━━⬣
┃
┃ Failed to detect
┃ message sender.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                quotedMessageId ===
                msg?.key?.id
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ DELETE ERROR 〕━━⬣
┃
┃ Cannot delete the
┃ command message.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const rawBotId =
                sock?.user?.id || ''

            const botNumber =
                rawBotId.includes(':')
                    ? rawBotId.split(':')[0] +
                      '@s.whatsapp.net'
                    : rawBotId

            if (
                !botNumber ||
                typeof botNumber !==
                    'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ DELETE ERROR 〕━━⬣
┃
┃ Failed to detect
┃ bot number.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                from.endsWith('@g.us')
            ) {

                const sender =
                    msg?.key?.participant ||
                    msg?.participant ||
                    null

                if (
                    !sender ||
                    typeof sender !==
                        'string'
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ❌ DELETE ERROR 〕━━⬣
┃
┃ Unable to detect
┃ sender.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                const normalizedSender =
                    sender.includes(':')
                        ? sender.split(':')[0] +
                          '@s.whatsapp.net'
                        : sender

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
`╭━━〔 ❌ GROUP ERROR 〕━━⬣
┃
┃ Invalid group
┃ metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
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

                const isSenderAdmin =
                    admins.includes(
                        normalizedSender
                    )

                const isBotAdmin =
                    admins.includes(
                        botNumber
                    )

                const isOwnMessage =
                    quotedParticipant ===
                    botNumber

                if (
                    !isSenderAdmin &&
                    !isOwnMessage
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ❌ ACCESS DENIED 〕━━⬣
┃
┃ Only group admins
┃ can delete other
┃ users messages.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                if (
                    !isBotAdmin &&
                    !isOwnMessage
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ❌ BOT NOT ADMIN 〕━━⬣
┃
┃ Bot must be admin
┃ to delete messages.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                const targetExists =
                    participants.some(
                        member =>
                            member.id ===
                            quotedParticipant
                    )

                if (!targetExists) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ❌ DELETE ERROR 〕━━⬣
┃
┃ Message sender is
┃ not in this group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }
            }

            try {

                await sock.sendMessage(
                    from,
                    {
                        delete: {
                            remoteJid:
                                from,
                            fromMe:
                                quotedParticipant ===
                                botNumber,
                            id:
                                quotedMessageId,
                            participant:
                                quotedParticipant
                        }
                    }
                )

            } catch (deleteError) {

                console.log(
                    'Delete Message Error:',
                    deleteError
                )

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ DELETE FAILED 〕━━⬣
┃
┃ Failed to delete
┃ the message.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

        } catch (error) {

            console.log(
                'Delete Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ delete command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}