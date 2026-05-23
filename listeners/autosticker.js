module.exports = {
    name: 'autosticker',

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
                typeof global.autoStickerEnabled !==
                'boolean'
            ) {

                global.autoStickerEnabled =
                    false
            }

            const option =
                args[0]
                    ?.trim()
                    ?.toLowerCase() || ''

            if (!option) {

                const currentStatus =
                    global.autoStickerEnabled
                        ? 'ON'
                        : 'OFF'

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 🖼️ AUTO STICKER 〕━━⬣
┃
┃ Status: ${currentStatus}
┃
┃ Usage:
┃ .autosticker on
┃ .autosticker off
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
┃ .autosticker on
┃ .autosticker off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (option === 'on') {

                if (
                    global.autoStickerEnabled ===
                    true
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ⚠️ AUTO STICKER 〕━━⬣
┃
┃ Auto sticker is
┃ already enabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                global.autoStickerEnabled =
                    true

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ✅ AUTO STICKER 〕━━⬣
┃
┃ Auto sticker has
┃ been enabled.
┃
┃ Images and short
┃ videos will now
┃ convert automatically.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (option === 'off') {

                if (
                    global.autoStickerEnabled ===
                    false
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ⚠️ AUTO STICKER 〕━━⬣
┃
┃ Auto sticker is
┃ already disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                global.autoStickerEnabled =
                    false

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ✅ AUTO STICKER 〕━━⬣
┃
┃ Auto sticker has
┃ been disabled.
┃
┃ Automatic sticker
┃ creation stopped.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

        } catch (error) {

            console.log(
                'AutoSticker Command Error:',
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
┃ autosticker command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}