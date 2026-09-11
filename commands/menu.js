const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')

const settings = require('../settings')

// ========================================
// GLOBAL STORAGE
// ========================================

global.menuReplies =
    global.menuReplies || {}

// ========================================
// PATHS
// ========================================

const commandsPath =
    path.join(
        __dirname,
        '../commands'
    )

// ========================================
// COMMAND COUNT
// ========================================

function getCommandCount() {

    try {

        if (
            !fs.existsSync(
                commandsPath
            )
        ) {

            return 0
        }

        return fs
            .readdirSync(
                commandsPath
            )
            .filter(file =>
                file.endsWith('.js')
            )
            .filter(file => {

                try {

                    const filePath =
                        path.join(
                            commandsPath,
                            file
                        )

                    delete require.cache[
                        require.resolve(filePath)
                    ]

                    const cmd =
                        require(filePath)

                    return (
                        cmd &&
                        cmd.name &&
                        typeof cmd.execute ===
                        'function'
                    )

                } catch {

                    return false
                }

            })
            .length

    } catch {

        return 0
    }
}

// ========================================
// AUTO CLEAN MENU REPLIES
// ========================================

setInterval(() => {

    try {

        const now =
            Date.now()

        Object.keys(
            global.menuReplies
        ).forEach(user => {

            const data =
                global.menuReplies[user]

            if (
                !data ||
                now - data.time >
                300000
            ) {

                delete global
                    .menuReplies[user]
            }
        })

    } catch {}

}, 60000).unref()

// ========================================
// GET MESSAGE BODY
// ========================================

function getBody(msg) {

    try {

        const message =
            msg.message || {}

        const ephemeral =
            message
                ?.ephemeralMessage
                ?.message || {}

        const viewOnce =
            message
                ?.viewOnceMessage
                ?.message || {}

        const msgData =
            Object.keys(ephemeral).length
                ? ephemeral
                : Object.keys(viewOnce).length
                ? viewOnce
                : message

        return (

            msgData.conversation ||

            msgData
                ?.extendedTextMessage
                ?.text ||

            msgData
                ?.imageMessage
                ?.caption ||

            msgData
                ?.videoMessage
                ?.caption ||

            msgData
                ?.buttonsResponseMessage
                ?.selectedButtonId ||

            msgData
                ?.listResponseMessage
                ?.singleSelectReply
                ?.selectedRowId ||

            ''
        )

    } catch {

        return ''
    }
}

// ========================================
// EXPORT
// ========================================

module.exports = {

    name: 'menu',

    aliases: [
        'help',
        'allmenu'
    ],

    category: 'main',

    description:
        'Grouped menu system',

    // ========================================
    // EXECUTE MENU
    // ========================================

    async execute(
        sock,
        msg,
        args,
        {
            prefix
        }
    ) {

        try {

            if (
                !sock ||
                !msg
            ) {
                return
            }

            const from =
                msg.key?.remoteJid

            if (!from) {
                return
            }

            const rawSender = (

                msg.key
                    ?.participant ||

                from ||

                ''

            )

            const sender =
                rawSender.includes(
                    '@s.whatsapp.net'
                )
                    ? rawSender.split(':')[0]
                    : rawSender.split(':')[0] +
                      '@s.whatsapp.net'

            const pushName =
                msg.pushName ||
                'User'

            const date =
                moment()
                    .tz(
                        settings.timezone ||
                        'Africa/Kampala'
                    )
                    .format(
                        'DD/MM/YYYY'
                    )

            const time =
                moment()
                    .tz(
                        settings.timezone ||
                        'Africa/Kampala'
                    )
                    .format(
                        'HH:mm:ss'
                    )

            const menu = `
╭━━━〔 🤖 NOX SPARROW BOT 〕━━━⬣
┃
┃ 👤 User: ${pushName}
┃ ⚡ Prefix: ${prefix}
┃ 📅 Date: ${date}
┃ ⏰ Time: ${time}
┃ 📦 Commands: ${getCommandCount()}
┃
┣━━〔 📂 MENU LIST 〕━━⬣
┃
┃ 1️⃣ MAIN MENU
┃ 2️⃣ OWNER MENU
┃ 3️⃣ GROUP MENU
┃ 4️⃣ SEARCH MENU
┃ 5️⃣ DOWNLOAD MENU
┃ 6️⃣ TOOLS MENU
┃ 7️⃣ FUN MENU
┃
┣━━━━━━━━━━━━━━━━⬣
┃
┃ 💬 Reply with number
┃ Example: 1
┃
╰━━━━━━━━━━━━━━━━━━⬣

${settings.footer || ''}
`

            let sentMessage

            // ========================================
            // SEND IMAGE MENU
            // ========================================

            try {

                if (

                    settings.botImage &&

                    fs.existsSync(
                        settings.botImage
                    )

                ) {

                    sentMessage =
                        await sock.sendMessage(

                            from,

                            {

                                image:
                                    fs.readFileSync(
                                        settings.botImage
                                    ),

                                caption:
                                    menu
                            },

                            {
                                quoted: msg
                            }
                        )

                } else {

                    sentMessage =
                        await sock.sendMessage(

                            from,

                            {
                                text: menu
                            },

                            {
                                quoted: msg
                            }
                        )
                }

            } catch {

                sentMessage =
                    await sock.sendMessage(

                        from,

                        {
                            text: menu
                        },

                        {
                            quoted: msg
                        }
                    )
            }

            // ========================================
            // SAVE MENU SESSION
            // ========================================

            global.menuReplies[
                sender
            ] = {

                key:
                    sentMessage
                        ?.key
                        ?.id,

                time:
                    Date.now(),

                prefix
            }

            console.log(
                `✅ MENU SENT TO ${sender}`
            )

        } catch (err) {

            console.log(
                '❌ MENU ERROR:'
            )

            console.log(err)
        }
    },

    // ========================================
    // REPLY HANDLER
    // ========================================

    async replyHandler(
        sock,
        msg
    ) {

        try {
            if (!sock || !msg?.message) return false

            const from = msg.key?.remoteJid
            if (!from || from === 'status@broadcast') return false

            const rawSender = msg.key?.participant || from || ''
            const senderNumber = rawSender.split(':')[0]
            const sender = senderNumber.includes('@')
                ? senderNumber
                : senderNumber + '@s.whatsapp.net'

            const replyData = global.menuReplies?.[sender]
            if (!replyData) return false

            // Accept BOTH ways:
            // 1. User replies/quotes the menu message with 1-7.
            // 2. User simply sends 1-7 after opening the menu.
            // This keeps the menu useful on WhatsApp clients where
            // replying to an image message is inconvenient.
            const message = msg.message || {}
            const wrappers = [
                message,
                message.ephemeralMessage?.message,
                message.viewOnceMessage?.message,
                message.viewOnceMessageV2?.message
            ].filter(Boolean)

            let body = ''
            let quotedId = null

            for (const current of wrappers) {
                body =
                    current.conversation ||
                    current.extendedTextMessage?.text ||
                    current.imageMessage?.caption ||
                    current.videoMessage?.caption ||
                    current.buttonsResponseMessage?.selectedButtonId ||
                    current.listResponseMessage?.singleSelectReply?.selectedRowId ||
                    current.templateButtonReplyMessage?.selectedId ||
                    ''

                const contextInfo =
                    current.extendedTextMessage?.contextInfo ||
                    current.imageMessage?.contextInfo ||
                    current.videoMessage?.contextInfo ||
                    current.buttonsResponseMessage?.contextInfo ||
                    current.listResponseMessage?.contextInfo ||
                    current.templateButtonReplyMessage?.contextInfo

                quotedId = contextInfo?.stanzaId || null

                if (body) break
            }

            body = String(body || '').trim()
            if (!body) return false

            // If the user quoted another message, only accept it when it is
            // the menu message we sent. Direct 1-7 replies are also accepted.
            if (quotedId && String(quotedId).trim() !== String(replyData.key).trim()) {
                return false
            }

            const response = menusForPrefix(replyData.prefix, body)
            if (!response) return false

            await sock.sendMessage(
                from,
                { text: response },
                { quoted: msg }
            )

            console.log(`✅ MENU REPLY ${body} TO ${sender}`)

            // Consume the menu selection so random later 1-7 messages
            // don't keep triggering the same menu forever.
            delete global.menuReplies[sender]

            return true

        } catch (err) {
            console.log('❌ MENU REPLY ERROR:', err?.message || err)
            return false
        }
    }
}

function menusForPrefix(prefix, body) {
    const menus = {
        '1': `╭━━━〔 ⚙️ MAIN MENU 〕━━━⬣\n┃ ${prefix}menu\n┃ ${prefix}ping\n┃ ${prefix}alive\n┃ ${prefix}runtime\n┃ ${prefix}uptime\n╰━━━━━━━━━━━━━━━━━━⬣`,
        '2': `╭━━━〔 👤 OWNER MENU 〕━━━⬣\n┃ ${prefix}owner\n┃ ${prefix}repo\n┃ ${prefix}setname\n┃ ${prefix}setbio\n╰━━━━━━━━━━━━━━━━━━⬣`,
        '3': `╭━━━〔 👥 GROUP MENU 〕━━━⬣\n┃ ${prefix}tagall\n┃ ${prefix}kick\n┃ ${prefix}promote\n┃ ${prefix}demote\n╰━━━━━━━━━━━━━━━━━━⬣`,
        '4': `╭━━━〔 🔎 SEARCH MENU 〕━━━⬣\n┃ ${prefix}weather\n┃ ${prefix}news\n┃ ${prefix}movie\n╰━━━━━━━━━━━━━━━━━━⬣`,
        '5': `╭━━━〔 📥 DOWNLOAD MENU 〕━━━⬣\n┃ ${prefix}play\n┃ ${prefix}ytmp3\n┃ ${prefix}ytmp4\n╰━━━━━━━━━━━━━━━━━━⬣`,
        '6': `╭━━━〔 🛠️ TOOLS MENU 〕━━━⬣\n┃ ${prefix}sticker\n┃ ${prefix}tourl\n┃ ${prefix}qr\n╰━━━━━━━━━━━━━━━━━━⬣`,
        '7': `╭━━━〔 🎭 FUN MENU 〕━━━⬣\n┃ ${prefix}joke\n┃ ${prefix}truth\n┃ ${prefix}dare\n╰━━━━━━━━━━━━━━━━━━⬣`
    }
    return menus[body] || null
}
