module.exports = {
    name: 'setname',

    async execute(sock, msg, args) {

        const from =
            msg?.key?.remoteJid

        try {

            if (
                !from ||
                typeof from !== 'string'
            ) {
                return
            }

            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            const newName =
                args.join(' ').trim()

            if (!newName) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ✏️ SET BOT NAME 〕━━⬣
┃
┃ 📌 Example:
┃ .setname Nox Star
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                newName.length > 25
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID NAME 〕━━⬣
┃
┃ Bot name is too long.
┃ Maximum: 25 characters.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 ⏳ PROCESSING 〕━━⬣
┃
┃ Updating bot name...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            await sock.updateProfileName(
                newName
            )

            const text =
`╭━━〔 ✅ BOT NAME UPDATED 〕━━⬣
┃
┃ 🤖 New Bot Name:
┃ ${newName}
┃
┃ ⚡ Changes saved
┃ successfully.
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(from, {
                text
            })

        } catch (error) {

            console.log(
                'SetName Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ UPDATE FAILED 〕━━⬣
┃
┃ Failed to update
┃ bot profile name.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}