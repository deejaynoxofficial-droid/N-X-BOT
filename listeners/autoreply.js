module.exports = {
    name: 'autoreply',

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
                    'function'
            ) {
                return
            }

            if (
                typeof global !==
                    'object' ||
                global === null
            ) {
                return
            }

            if (
                !from ||
                typeof from !== 'string'
            ) {
                return
            }

            const ownerNumbers = [
                '256700000000@s.whatsapp.net'
            ]

            const sender =
                msg?.key?.participant ||
                msg?.participant ||
                msg?.key?.remoteJid ||
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
`╭━━〔 ❌ ERROR 〕━━⬣
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

            const isOwner =
                ownerNumbers.includes(
                    normalizedSender
                )

            if (!isOwner) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ACCESS DENIED 〕━━⬣
┃
┃ Only the bot owner
┃ can use this command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            if (
                typeof global.autoReplyEnabled !==
                'boolean'
            ) {

                global.autoReplyEnabled =
                    false
            }

            if (
                typeof global.autoReplyMessage !==
                'string'
            ) {

                global.autoReplyMessage =
                    '🤖 Hello, I am currently busy. I will reply later.'
            }

            const option =
                args[0]
                    ?.trim()
                    ?.toLowerCase() || ''

            if (!option) {

                const currentStatus =
                    global.autoReplyEnabled
                        ? 'ON'
                        : 'OFF'

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 🤖 AUTO REPLY 〕━━⬣
┃
┃ Status: ${currentStatus}
┃
┃ Current Message:
┃ ${global.autoReplyMessage}
┃
┃ Usage:
┃ .autoreply on
┃ .autoreply off
┃ .autoreply message Hello
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const validOptions = [
                'on',
                'off',
                'message'
            ]

            if (
                !validOptions.includes(
                    option
                )
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID OPTION 〕━━⬣
┃
┃ Use:
┃ .autoreply on
┃ .autoreply off
┃ .autoreply message
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (option === 'on') {

                if (
                    global.autoReplyEnabled ===
                    true
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ⚠️ AUTO REPLY 〕━━⬣
┃
┃ Auto reply is
┃ already enabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                global.autoReplyEnabled =
                    true

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ✅ AUTO REPLY 〕━━⬣
┃
┃ Auto reply has
┃ been enabled.
┃
┃ The bot will now
┃ reply automatically.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (option === 'off') {

                if (
                    global.autoReplyEnabled ===
                    false
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ⚠️ AUTO REPLY 〕━━⬣
┃
┃ Auto reply is
┃ already disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                global.autoReplyEnabled =
                    false

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ✅ AUTO REPLY 〕━━⬣
┃
┃ Auto reply has
┃ been disabled.
┃
┃ Automatic replies
┃ have been stopped.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                option === 'message'
            ) {

                const customMessage =
                    args
                        .slice(1)
                        .join(' ')
                        .trim()

                if (
                    !customMessage
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ❌ MISSING MESSAGE 〕━━⬣
┃
┃ Please provide
┃ a custom message.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                if (
                    customMessage.length >
                    300
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ❌ MESSAGE TOO LONG 〕━━⬣
┃
┃ Maximum allowed:
┃ 300 characters.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                const blockedWords = [
                    '<script',
                    '</script>',
                    'eval(',
                    'function('
                ]

                const containsBlocked =
                    blockedWords.some(
                        word =>
                            customMessage
                                .toLowerCase()
                                .includes(word)
                    )

                if (
                    containsBlocked
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ❌ BLOCKED CONTENT 〕━━⬣
┃
┃ Message contains
┃ restricted content.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                global.autoReplyMessage =
                    customMessage

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ✅ AUTO REPLY 〕━━⬣
┃
┃ Auto reply message
┃ updated successfully.
┃
┃ 📝 New Message:
┃ ${customMessage}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

        } catch (error) {

            console.log(
                'AutoReply Command Error:',
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
┃ autoreply command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}