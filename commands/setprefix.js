const fs = require('fs')
const path = require('path')

const dbPath = path.join(
    __dirname,
    '../database/database.json'
)

module.exports = {
    name: 'setprefix',

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

            const newPrefix =
                args[0]

            if (!newPrefix) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ⚙️ SET PREFIX 〕━━⬣
┃
┃ 📌 Example:
┃ .setprefix !
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                newPrefix.length > 3
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
                            '❌ Prefix is too long.'
                    }
                )
            }

            let db = {}

            try {

                if (
                    fs.existsSync(dbPath)
                ) {

                    const raw =
                        fs.readFileSync(
                            dbPath,
                            'utf8'
                        )

                    db =
                        raw &&
                        raw.trim() !== ''
                            ? JSON.parse(raw)
                            : {}

                } else {

                    db = {}
                }

            } catch (dbError) {

                console.log(
                    'Database Read Error:',
                    dbError
                )

                db = {}
            }

            db.prefix =
                newPrefix

            try {

                fs.writeFileSync(
                    dbPath,
                    JSON.stringify(
                        db,
                        null,
                        2
                    )
                )

            } catch (writeError) {

                console.log(
                    'Database Write Error:',
                    writeError
                )

                return await sock.sendMessage(
                    from,
                    {
                        text:
                            '❌ Failed to save new prefix.'
                    }
                )
            }

            const text =
`╭━━〔 ✅ PREFIX UPDATED 〕━━⬣
┃
┃ 🔥 New Prefix:
┃ ${newPrefix}
┃
┃ ⚡ Bot commands now use:
┃ ${newPrefix}menu
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(from, {
                text
            })

        } catch (error) {

            console.log(
                'SetPrefix Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
                        '❌ Failed to change prefix.'
                })

            } catch {}
        }
    }
}