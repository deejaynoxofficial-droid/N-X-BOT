module.exports = {
    name: 'broadcast',

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
                typeof sock.groupFetchAllParticipating !==
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

            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            const message =
                args.join(' ').trim()

            if (!message) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 📢 BROADCAST COMMAND 〕━━⬣
┃
┃ Example:
┃ .broadcast Hello everyone
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            if (
                message.length > 3000
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Broadcast message
┃ is too long.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 📡 BROADCAST STARTED 〕━━⬣
┃
┃ Sending message
┃ to all chats...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            let chats = []

            try {

                const groups =
                    await sock.groupFetchAllParticipating()

                if (
                    groups &&
                    typeof groups ===
                        'object'
                ) {

                    chats =
                        Object.keys(groups)
                }

            } catch (groupError) {

                console.log(
                    'Group Fetch Error:',
                    groupError
                )
            }

            const uniqueChats =
                [...new Set(chats)]

            if (
                uniqueChats.length === 0
            ) {

                return await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ NO CHATS FOUND 〕━━⬣
┃
┃ Unable to find
┃ groups for broadcast.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            }

            let success = 0
            let failed = 0

            const broadcastText =
`╭━━〔 📢 BROADCAST MESSAGE 〕━━⬣
┃
${message}
┃
╰━━━━━━━━━━━━━━━━━━⬣`

            for (
                const jid of uniqueChats
            ) {

                try {

                    if (
                        !jid ||
                        typeof jid !==
                            'string'
                    ) {
                        continue
                    }

                    await sock.sendMessage(jid, {
                        text:
                            broadcastText
                    })

                    success++

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                1000
                            )
                    )

                } catch (sendError) {

                    failed++

                    console.log(
                        `Broadcast Failed: ${jid}`,
                        sendError
                    )
                }
            }

            await sock.sendMessage(from, {
                text:
`╭━━〔 ✅ BROADCAST COMPLETE 〕━━⬣
┃
┃ 📤 Sent:
┃ ${success}
┃
┃ ❌ Failed:
┃ ${failed}
┃
┃ 📊 Total:
┃ ${uniqueChats.length}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            })

        } catch (error) {

            console.log(
                'Broadcast Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to execute
┃ broadcast command.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                })

            } catch {}
        }
    }
}