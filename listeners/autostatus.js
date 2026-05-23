module.exports = {
    name: 'autostatusview',

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
                typeof sock.readMessages !==
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
                typeof sender !== 'string'
            ) {
                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Unable to
┃ detect sender.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
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
                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ACCESS DENIED 〕━━⬣
┃
┃ Only the bot owner
┃ can use this command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
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

            if (
                typeof global !==
                'object'
            ) {
                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Global configuration
┃ unavailable.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                typeof global.autoStatusView !==
                'boolean'
            ) {
                global.autoStatusView =
                    false
            }

            if (!option) {

                const currentStatus =
                    global.autoStatusView
                        ? 'ON'
                        : 'OFF'

                return sock.sendMessage(from, {
                    text:
`╭━━〔 👀 AUTO STATUS VIEW 〕━━⬣
┃
┃ Status: ${currentStatus}
┃
┃ Usage:
┃ .autostatusview on
┃ .autostatusview off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
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
                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ INVALID OPTION 〕━━⬣
┃
┃ Use:
┃ .autostatusview on
┃ .autostatusview off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'on') {

                if (
                    global.autoStatusView ===
                    true
                ) {
                    return sock.sendMessage(from, {
                        text:
`╭━━〔 ⚠️ AUTO STATUS VIEW 〕━━⬣
┃
┃ Auto status view
┃ is already enabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }

                global.autoStatusView =
                    true

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ✅ AUTO STATUS VIEW 〕━━⬣
┃
┃ Bot will now
┃ automatically view
┃ WhatsApp statuses.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'off') {

                if (
                    global.autoStatusView ===
                    false
                ) {
                    return sock.sendMessage(from, {
                        text:
`╭━━〔 ⚠️ AUTO STATUS VIEW 〕━━⬣
┃
┃ Auto status view
┃ is already disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }

                global.autoStatusView =
                    false

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ✅ AUTO STATUS VIEW 〕━━⬣
┃
┃ Bot will stop
┃ automatically viewing
┃ WhatsApp statuses.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

        } catch (error) {

            console.log(
                'AutoStatusView Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ autostatusview
┃ command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    },

    async run(sock, msg, args) {
        return this.execute(
            sock,
            msg,
            args
        )
    }
}
