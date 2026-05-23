const fs = require('fs')
const path = require('path')

const dbFolder = path.join(
    __dirname,
    '../database'
)

const dbPath = path.join(
    dbFolder,
    'database.json'
)

module.exports = {
    name: 'nsfw',

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
                typeof sock.groupMetadata !==
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

                return sock.sendMessage(from, {
                    text:
`╭━━〔 🔞 NSFW COMMAND 〕━━⬣
┃
┃ This command only
┃ works in groups.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const sender =
                msg?.key?.participant ||
                msg?.participant ||
                null

            if (!sender) {
                return
            }

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

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to fetch
┃ group metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                !metadata ||
                !Array.isArray(
                    metadata.participants
                )
            ) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Invalid group
┃ metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const admins =
                metadata.participants
                    .filter(
                        member =>
                            member &&
                            member.admin
                    )
                    .map(
                        member =>
                            member.id
                    )

            const rawBotId =
                sock?.user?.id || ''

            const botNumber =
                rawBotId
                    .split(':')[0]
                    ?.trim() +
                '@s.whatsapp.net'

            const isSenderAdmin =
                admins.includes(sender)

            const isBotAdmin =
                admins.includes(botNumber)

            if (!isSenderAdmin) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ACCESS DENIED 〕━━⬣
┃
┃ Only group admins
┃ can use this command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (!isBotAdmin) {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ BOT ADMIN REQUIRED 〕━━⬣
┃
┃ Bot must be admin
┃ to manage NSFW mode.
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

            if (!option) {

                let db = {}

                if (
                    fs.existsSync(
                        dbPath
                    )
                ) {

                    try {

                        const raw =
                            fs.readFileSync(
                                dbPath,
                                'utf8'
                            )

                        db =
                            raw &&
                            raw.trim() !== ''
                                ? JSON.parse(
                                      raw
                                  )
                                : {}

                    } catch {

                        db = {}
                    }
                }

                if (
                    typeof db !==
                        'object' ||
                    Array.isArray(db)
                ) {
                    db = {}
                }

                if (
                    !db.nsfw ||
                    typeof db.nsfw !==
                        'object'
                ) {
                    db.nsfw = {}
                }

                const currentStatus =
                    db.nsfw[from]
                        ? 'ON'
                        : 'OFF'

                return sock.sendMessage(from, {
                    text:
`╭━━〔 🔞 NSFW SETTINGS 〕━━⬣
┃
┃ Status: ${currentStatus}
┃
┃ Usage:
┃ .nsfw on
┃ .nsfw off
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
┃ .nsfw on
┃ .nsfw off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            try {

                if (
                    !fs.existsSync(
                        dbFolder
                    )
                ) {

                    fs.mkdirSync(
                        dbFolder,
                        {
                            recursive: true
                        }
                    )
                }

            } catch (folderError) {

                console.log(
                    'Folder Error:',
                    folderError
                )

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to create
┃ database folder.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            let db = {}

            try {

                if (
                    fs.existsSync(
                        dbPath
                    )
                ) {

                    const raw =
                        fs.readFileSync(
                            dbPath,
                            'utf8'
                        )

                    db =
                        raw &&
                        raw.trim() !== ''
                            ? JSON.parse(
                                  raw
                              )
                            : {}
                }

            } catch (readError) {

                console.log(
                    'Database Read Error:',
                    readError
                )

                db = {}
            }

            if (
                typeof db !==
                    'object' ||
                Array.isArray(db)
            ) {
                db = {}
            }

            if (
                !db.nsfw ||
                typeof db.nsfw !==
                    'object'
            ) {

                db.nsfw = {}
            }

            db.nsfw[from] =
                option === 'on'

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

                return sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to save
┃ NSFW settings.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (option === 'on') {

                return sock.sendMessage(from, {
                    text:
`╭━━〔 🔞 NSFW ENABLED 〕━━⬣
┃
┃ NSFW mode has been
┃ enabled successfully.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            return sock.sendMessage(from, {
                text:
`╭━━〔 🔞 NSFW DISABLED 〕━━⬣
┃
┃ NSFW mode has been
┃ disabled successfully.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

        } catch (error) {

            console.log(
                'NSFW Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ NSFW command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}