module.exports = {
    name: 'add',

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
                typeof sock.groupParticipantsUpdate !==
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

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ GROUP ONLY 〕━━⬣
┃
┃ This command only works
┃ inside WhatsApp groups.
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

            const input =
                args[0] || ''

            const number =
                input
                    .replace(
                        /[^0-9]/g,
                        ''
                    )
                    .trim()

            if (!number) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ➕ ADD COMMAND 〕━━⬣
┃
┃ 📌 Usage:
┃ .add 256700000000
┃
┃ 📍 Example:
┃ .add 256712345678
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                number.length < 8 ||
                number.length > 15
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID NUMBER 〕━━⬣
┃
┃ Please provide a valid
┃ phone number.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const blockedNumbers = [
                '911',
                '112',
                '999'
            ]

            if (
                blockedNumbers.includes(
                    number
                )
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ BLOCKED NUMBER 〕━━⬣
┃
┃ This number cannot
┃ be added.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const sender =
                msg?.key?.participant ||
                msg?.participant ||
                null

            if (
                !sender ||
                typeof sender !== 'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to detect
┃ command sender.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
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

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ GROUP ERROR 〕━━⬣
┃
┃ Failed to fetch
┃ group metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !metadata ||
                !Array.isArray(
                    metadata.participants
                )
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID GROUP 〕━━⬣
┃
┃ Unable to load
┃ group participants.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const participants =
                metadata.participants

            const admins =
                participants
                    .filter(
                        member =>
                            member.admin
                    )
                    .map(
                        member =>
                            member.id
                    )

            const normalizedSender =
                sender.includes(':')
                    ? sender.split(':')[0] +
                      '@s.whatsapp.net'
                    : sender

            const rawBotId =
                sock?.user?.id || ''

            const normalizedBot =
                rawBotId.includes(':')
                    ? rawBotId.split(':')[0] +
                      '@s.whatsapp.net'
                    : rawBotId

            const isAdmin =
                admins.includes(
                    normalizedSender
                )

            const isBotAdmin =
                admins.includes(
                    normalizedBot
                )

            if (!isAdmin) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ADMIN ONLY 〕━━⬣
┃
┃ Only group admins
┃ can use this command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (!isBotAdmin) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ BOT NOT ADMIN 〕━━⬣
┃
┃ Promote the bot
┃ to admin first.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const userJid =
`${number}@s.whatsapp.net`

            const alreadyInGroup =
                participants.some(
                    member =>
                        member.id ===
                        userJid
                )

            if (
                alreadyInGroup
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ⚠️ USER EXISTS 〕━━⬣
┃
┃ User is already
┃ inside this group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 ⏳ ADDING USER 〕━━⬣
┃
┃ Adding member to
┃ the group...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            let result = null

            try {

                result =
                    await sock.groupParticipantsUpdate(
                        from,
                        [userJid],
                        'add'
                    )

            } catch (addError) {

                console.log(
                    'Add Error:',
                    addError
                )

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ADD FAILED 〕━━⬣
┃
┃ Failed to add user.
┃ Try again later.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !Array.isArray(result) ||
                result.length === 0
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ INVALID RESPONSE 〕━━⬣
┃
┃ Failed to process
┃ add request.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const response =
                result[0] || {}

            const statusCode =
                response.status || 0

            if (
                statusCode !== 200
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ UNABLE TO ADD 〕━━⬣
┃
┃ Status Code:
┃ ${statusCode}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(
                from,
                {
                    text:
`╭━━〔 ✅ USER ADDED 〕━━⬣
┃
┃ 👤 Number:
┃ ${number}
┃
┃ 🎉 Successfully added
┃ to the group.
┃
╰━━━━━━━━━━━━━━━━━━⬣`,
                    mentions: [userJid]
                }
            )

        } catch (error) {

            console.log(
                'Add Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ COMMAND ERROR 〕━━⬣
┃
┃ Failed to execute
┃ add command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}