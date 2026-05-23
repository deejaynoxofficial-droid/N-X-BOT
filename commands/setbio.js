module.exports = {
    name: 'setbio',

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

            const newBio =
                args.join(' ').trim()

            if (!newBio) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 📝 SET BOT BIO 〕━━⬣
┃
┃ 📌 Example:
┃ .setbio POWER MD ACTIVE
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                newBio.length > 139
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID BIO 〕━━⬣
┃
┃ Bio is too long.
┃ Maximum: 139 characters.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 ⏳ PROCESSING 〕━━⬣
┃
┃ Updating bot bio...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            await sock.updateProfileStatus(
                newBio
            )

            const text =
`╭━━〔 ✅ BIO UPDATED 〕━━⬣
┃
┃ 📝 New Bot Bio:
┃ ${newBio}
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
                'SetBio Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ UPDATE FAILED 〕━━⬣
┃
┃ Failed to update
┃ bot bio.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}