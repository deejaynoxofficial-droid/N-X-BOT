module.exports = {
    name: 'adminsonly',

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
                typeof sock.groupSettingUpdate !==
                    'function' ||
                typeof sock.groupMetadata !==
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

            if (
                !from.endsWith('@g.us')
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 👮 ADMINS ONLY 〕━━⬣
┃
┃ This command only
┃ works in groups.
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

            const option =
                args[0]
                    ?.trim()
                    ?.toLowerCase() || ''

            if (!option) {

                const currentStatus =
                    global.adminsOnly?.[
                        from
                    ]
                        ? 'ON'
                        : 'OFF'

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 👮 ADMINS ONLY 〕━━⬣
┃
┃ Status: ${currentStatus}
┃
┃ Usage:
┃ .adminsonly on
┃ .adminsonly off
┃
┃ ON  → Only admins
┃ can send messages.
┃
┃ OFF → Everyone can
┃ send messages.
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
┃ .adminsonly on
┃ .adminsonly off
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

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
`╭━━〔 ❌ ERROR 〕━━⬣
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
                typeof metadata !==
                    'object' ||
                !Array.isArray(
                    metadata.participants
                )
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Invalid group
┃ metadata.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const participants =
                metadata.participants.filter(
                    member =>
                        member &&
                        typeof member ===
                            'object' &&
                        typeof member.id ===
                            'string'
                )

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
`╭━━〔 ❌ ACCESS DENIED 〕━━⬣
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
`╭━━〔 ❌ BOT ADMIN REQUIRED 〕━━⬣
┃
┃ Bot must be admin
┃ to change group
┃ settings.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                typeof global.adminsOnly !==
                    'object' ||
                global.adminsOnly ===
                    null
            ) {

                global.adminsOnly =
                    {}
            }

            if (option === 'on') {

                if (
                    global.adminsOnly[from] ===
                    true
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ⚠️ ADMINS ONLY 〕━━⬣
┃
┃ Admins-only mode
┃ is already enabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                try {

                    await sock.groupSettingUpdate(
                        from,
                        'announcement'
                    )

                    global.adminsOnly[
                        from
                    ] = true

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 👮 ADMINS ONLY ENABLED 〕━━⬣
┃
┃ Only group admins
┃ can now send
┃ messages.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )

                } catch (updateError) {

                    console.log(
                        'Enable Error:',
                        updateError
                    )

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to enable
┃ admins-only mode.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }
            }

            if (option === 'off') {

                if (
                    global.adminsOnly[from] ===
                    false
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ⚠️ ADMINS ONLY 〕━━⬣
┃
┃ Admins-only mode
┃ is already disabled.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                try {

                    await sock.groupSettingUpdate(
                        from,
                        'not_announcement'
                    )

                    global.adminsOnly[
                        from
                    ] = false

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 👥 ADMINS ONLY DISABLED 〕━━⬣
┃
┃ All group members
┃ can now send
┃ messages.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )

                } catch (updateError) {

                    console.log(
                        'Disable Error:',
                        updateError
                    )

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to disable
┃ admins-only mode.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }
            }

        } catch (error) {

            console.log(
                'AdminsOnly Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ adminsonly command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}