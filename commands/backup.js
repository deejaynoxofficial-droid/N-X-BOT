const fs = require('fs')
const path = require('path')

module.exports = {
    name: 'backup',

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

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Unable to detect
┃ sender.
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

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ACCESS DENIED 〕━━⬣
┃
┃ Only the bot owner
┃ can use this command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const databaseFolder =
                path.join(
                    __dirname,
                    '../database'
                )

            if (
                !fs.existsSync(
                    databaseFolder
                )
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ BACKUP FAILED 〕━━⬣
┃
┃ Database folder
┃ not found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            const files =
                fs.readdirSync(
                    databaseFolder
                )

            if (
                !Array.isArray(files) ||
                files.length === 0
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ BACKUP FAILED 〕━━⬣
┃
┃ No database files
┃ found.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 💾 BACKUP STARTED 〕━━⬣
┃
┃ Creating database
┃ backup...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            const backupFolder =
                path.join(
                    __dirname,
                    '../backups'
                )

            if (
                !fs.existsSync(
                    backupFolder
                )
            ) {

                fs.mkdirSync(
                    backupFolder,
                    {
                        recursive: true
                    }
                )
            }

            const timestamp =
                new Date()
                    .toISOString()
                    .replace(/[:.]/g, '-')

            const backupFileName =
                `database-backup-${timestamp}.json`

            const backupPath =
                path.join(
                    backupFolder,
                    backupFileName
                )

            const backupData = {}

            for (
                const file of files
            ) {

                try {

                    const filePath =
                        path.join(
                            databaseFolder,
                            file
                        )

                    const stats =
                        fs.statSync(
                            filePath
                        )

                    if (
                        stats.isFile()
                    ) {

                        const content =
                            fs.readFileSync(
                                filePath,
                                'utf8'
                            )

                        backupData[
                            file
                        ] = content
                    }

                } catch (fileError) {

                    console.log(
                        'Backup File Error:',
                        fileError
                    )
                }
            }

            fs.writeFileSync(
                backupPath,
                JSON.stringify(
                    backupData,
                    null,
                    2
                )
            )

            const backupBuffer =
                fs.readFileSync(
                    backupPath
                )

            await sock.sendMessage(from, {
                document:
                    backupBuffer,
                mimetype:
                    'application/json',
                fileName:
                    backupFileName,
                caption:
`╭━━〔 ✅ BACKUP COMPLETE 〕━━⬣
┃
┃ 📁 Backup created
┃ successfully.
┃
┃ 📦 Files:
┃ ${Object.keys(backupData).length}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

        } catch (error) {

            console.log(
                'Backup Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to create
┃ database backup.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}