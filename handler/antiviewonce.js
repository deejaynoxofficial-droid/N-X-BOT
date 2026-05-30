module.exports = {
    name: 'autoviewonce',

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
                typeof from !==
                    'string'
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
                typeof global.autoViewOnceEnabled !==
                'boolean'
            ) {

                global.autoViewOnceEnabled =
                    false
            }

            if (
                typeof global.autoViewOnceMode !==
                'string'
            ) {

                global.autoViewOnceMode =
                    'private'
            }

            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            const option =
                args[0]
                    ?.trim()
                    ?.toLowerCase() || ''

            const mode =
                args[1]
                    ?.trim()
                    ?.toLowerCase() || ''

            if (!option) {

                const status =
                    global.autoViewOnceEnabled
                        ? 'ON'
                        : 'OFF'

                const currentMode =
                    global.autoViewOnceMode ||
                    'private'

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 👁️ AUTO VIEW-ONCE 〕━━⬣
┃
┃ Status: ${status}
┃ Mode: ${currentMode.toUpperCase()}
┃
┃ Usage:
┃ .autoviewonce on private
┃ .autoviewonce on chat
┃ .autoviewonce off
┃
┃ PRIVATE → Sends media
┃ to owner inbox.
┃
┃ CHAT → Sends media
┃ to current chat.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const validOptions = [
                'on',
                'off'
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
┃ on
┃ off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (option === 'on') {

                const validModes = [
                    'private',
                    'chat'
                ]

                if (
                    !validModes.includes(
                        mode
                    )
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ❌ INVALID MODE 〕━━⬣
┃
┃ Available Modes:
┃ private
┃ chat
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                global.autoViewOnceEnabled =
                    true

                global.autoViewOnceMode =
                    mode

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ✅ AUTO VIEW-ONCE 〕━━⬣
┃
┃ Status: ENABLED
┃ Mode: ${mode.toUpperCase()}
┃
┃ View-once media will
┃ now be captured
┃ automatically.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (option === 'off') {

                if (
                    global.autoViewOnceEnabled ===
                    false
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ⚠️ AUTO VIEW-ONCE 〕━━⬣
┃
┃ Auto view-once is
┃ already disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                global.autoViewOnceEnabled =
                    false

                global.autoViewOnceMode =
                    'private'

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ✅ AUTO VIEW-ONCE 〕━━⬣
┃
┃ Status: DISABLED
┃
┃ View-once media will
┃ no longer be captured.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

        } catch (error) {

            console.log(
                'AutoViewOnce Command Error:',
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
┃ autoviewonce command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}