const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')

const settings =
    require('../settings')

//========================================
// GLOBAL STORAGE
//========================================

global.menuReplies =
    global.menuReplies || {}

//========================================
// PATHS
//========================================

const commandsPath =
    path.join(
        __dirname,
        '../commands'
    )

//========================================
// COMMAND COUNT
//========================================

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
            .length

    } catch {

        return 0
    }
}

//========================================
// AUTO CLEAN MENU REPLIES
//========================================

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
}, 60000)

//========================================
// GET MESSAGE BODY
//========================================

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

//========================================
// MENU EXPORT
//========================================

module.exports = {

    name: 'menu',

    aliases: [
        'help',
        'allmenu'
    ],

    category: 'main',

    description:
        'Grouped menu system',

    //========================================
    // EXECUTE MENU
    //========================================

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

            const sender = (

                msg.key
                    ?.participant ||

                from ||

                ''

            ).split(':')[0]

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

            //========================================
            // SEND IMAGE MENU
            //========================================

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

            //========================================
            // SAVE MENU SESSION
            //========================================

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

    //========================================
    // MENU REPLY HANDLER
    //========================================

    async replyHandler(
        sock,
        msg
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

            const sender = (

                msg.key
                    ?.participant ||

                from ||

                ''

            ).split(':')[0]

            const replyData =
                global.menuReplies[
                    sender
                ]

            if (
                !replyData
            ) {
                return
            }

            //========================================
            // SAFE QUOTED CHECK
            //========================================

            const quoted =

                msg.message
                    ?.extendedTextMessage
                    ?.contextInfo
                    ?.stanzaId ||

                msg.message
                    ?.imageMessage
                    ?.contextInfo
                    ?.stanzaId ||

                msg.message
                    ?.videoMessage
                    ?.contextInfo
                    ?.stanzaId ||

                null

            if (
                !quoted ||
                quoted !==
                replyData.key
            ) {
                return
            }

            //========================================
            // GET REPLY TEXT
            //========================================

            const body =
                getBody(msg)
                    .trim()

            if (!body) {
                return
            }

            const prefix =
                replyData.prefix

            //========================================
            // MENU LISTS
            //========================================

            const menus = {

                '1': `
╭━━━〔 ⚙️ MAIN MENU 〕━━━⬣
┃ ${prefix}menu
┃ ${prefix}ping
┃ ${prefix}alive
┃ ${prefix}runtime
┃ ${prefix}uptime
╰━━━━━━━━━━━━━━━━━━⬣
`,

                '2': `
╭━━━〔 👤 OWNER MENU 〕━━━⬣
┃ ${prefix}owner
┃ ${prefix}repo
┃ ${prefix}setname
┃ ${prefix}setbio
┃ ${prefix}setbotdp
┃ ${prefix}setprefix
╰━━━━━━━━━━━━━━━━━━⬣
`,

                '3': `
╭━━━〔 👥 GROUP MENU 〕━━━⬣
┃ ${prefix}tagall
┃ ${prefix}kick
┃ ${prefix}promote
┃ ${prefix}demote
┃ ${prefix}mute
┃ ${prefix}antilink
╰━━━━━━━━━━━━━━━━━━⬣
`,

                '4': `
╭━━━〔 🔎 SEARCH MENU 〕━━━⬣
┃ ${prefix}weather
┃ ${prefix}news
┃ ${prefix}movie
┃ ${prefix}anime
┃ ${prefix}song
╰━━━━━━━━━━━━━━━━━━⬣
`,

                '5': `
╭━━━〔 📥 DOWNLOAD MENU 〕━━━⬣
┃ ${prefix}play
┃ ${prefix}video
┃ ${prefix}tiktok
┃ ${prefix}instagram
┃ ${prefix}ytmp3
┃ ${prefix}ytmp4
╰━━━━━━━━━━━━━━━━━━⬣
`,

                '6': `
╭━━━〔 🛠️ TOOLS MENU 〕━━━⬣
┃ ${prefix}sticker
┃ ${prefix}tourl
┃ ${prefix}toimg
┃ ${prefix}translate
┃ ${prefix}qr
╰━━━━━━━━━━━━━━━━━━⬣
`,

                '7': `
╭━━━〔 🎭 FUN MENU 〕━━━⬣
┃ ${prefix}quote
┃ ${prefix}joke
┃ ${prefix}fact
┃ ${prefix}truth
┃ ${prefix}dare
┃ ${prefix}ai
╰━━━━━━━━━━━━━━━━━━⬣
`
            }

            const response =
                menus[body]

            if (
                !response
            ) {
                return
            }

            //========================================
            // SEND MENU RESPONSE
            //========================================

            await sock.sendMessage(

                from,

                {
                    text: response
                },

                {
                    quoted: msg
                }
            )

            console.log(
                `✅ MENU REPLY ${body}`
            )

        } catch (err) {

            console.log(
                '❌ MENU REPLY ERROR:'
            )

            console.log(err)
        }
    }
}
