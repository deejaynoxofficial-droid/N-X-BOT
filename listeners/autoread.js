module.exports = {
    name: 'autoread',

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
                typeof global.autoReadEnabled !==
                'boolean'
            ) {
                global.autoReadEnabled =
                    false
            }

            if (!option) {

                const currentStatus =
                    global.autoReadEnabled
                        ? 'ON'
                        : 'OFF'

                return sock.sendMessage(from, {
                    text:
`╭━━〔 📖 AUTO READ 〕━━⬣
┃
┃ Status: ${currentStatus}
┃
┃ Usage:
┃ .autoread on
┃ .autoread off
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
┃ .autoread on
┃ .autoread off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'on') {

                if (
                    global.autoReadEnabled ===
                    true
                ) {
                    return sock.sendMessage(from, {
                        text:
`╭━━〔 ⚠️ AUTO READ 〕━━⬣
┃
┃ Auto read is already
┃ enabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }

                global.autoReadEnabled =
                    true

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ✅ AUTO READ ON 〕━━⬣
┃
┃ Bot will now
┃ automatically read
┃ incoming messages.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'off') {

                if (
                    global.autoReadEnabled ===
                    false
                ) {
                    return sock.sendMessage(from, {
                        text:
`╭━━〔 ⚠️ AUTO READ 〕━━⬣
┃
┃ Auto read is already
┃ disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    })
                }

                global.autoReadEnabled =
                    false

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ✅ AUTO READ OFF 〕━━⬣
┃
┃ Bot will stop
┃ automatically reading
┃ incoming messages.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

        } catch (error) {

            console.log(
                'AutoRead Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ autoread command.
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
