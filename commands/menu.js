const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')
const settings = require('../settings')

//========================================
// PATHS
//========================================

const dbPath = path.join(
    __dirname,
    '../database/database.json'
)

const commandsPath = path.join(
    __dirname,
    '../commands'
)

//========================================
// SAFE COMMAND COUNT
//========================================

function getCommandCount() {

    try {

        if (!fs.existsSync(commandsPath)) {
            return 0
        }

        return fs
            .readdirSync(commandsPath)
            .filter(file =>
                file.endsWith('.js')
            ).length

    } catch {

        return 0
    }
}

//========================================
// GLOBAL STORAGE
//========================================

global.menuReplies =
    global.menuReplies || {}

//========================================
// AUTO CLEANUP
//========================================

setInterval(() => {

    try {

        const now = Date.now()

        Object.keys(global.menuReplies)
            .forEach(key => {

                const data =
                    global.menuReplies[key]

                if (
                    !data ||
                    now - data.time >
                    300000
                ) {

                    delete global
                        .menuReplies[key]
                }
            })

    } catch {}
}, 60000)

//========================================
// GET PREFIX
//========================================

function getPrefix() {

    try {

        if (
            fs.existsSync(dbPath)
        ) {

            const raw =
                fs.readFileSync(
                    dbPath,
                    'utf8'
                )

            if (
                raw &&
                raw.trim() !== ''
            ) {

                const db =
                    JSON.parse(raw)

                return (
                    db?.settings?.bot
                        ?.prefix ||
                    settings.prefix ||
                    '.'
                )
            }
        }

    } catch {}

    return settings.prefix || '.'
}

//========================================
// GET BODY
//========================================

function getBody(msg) {

    try {

        const message =
            msg.message || {}

        const ephemeral =
            message?.ephemeralMessage
                ?.message || {}

        const viewOnce =
            message?.viewOnceMessage
                ?.message || {}

        const msgData =
            Object.keys(ephemeral).length
                ? ephemeral
                : Object.keys(viewOnce).length
                ? viewOnce
                : message

        return (

            msgData.conversation ||

            msgData.extendedTextMessage
                ?.text ||

            msgData.imageMessage
                ?.caption ||

            msgData.videoMessage
                ?.caption ||

            msgData.buttonsResponseMessage
                ?.selectedButtonId ||

            msgData.listResponseMessage
                ?.singleSelectReply
                ?.selectedRowId ||

            msgData.templateButtonReplyMessage
                ?.selectedId ||

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
        'Show grouped bot menu',

    //========================================
    // EXECUTE
    //========================================

    async execute(
        sock,
        msg
    ) {

        try {

            const from =
                msg.key?.remoteJid

            if (!from) return

            const sender = (
                msg.key?.participant ||
                msg.key?.remoteJid ||
                ''
            ).split(':')[0]

            const prefix =
                getPrefix()

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
┃ 👋 User: ${pushName}
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
            // IMAGE MENU
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
            // SAVE REPLY SESSION
            //========================================

            global.menuReplies[
                sender
            ] = {

                key:
                    sentMessage?.key?.id,

                time:
                    Date.now(),

                prefix
            }

            console.log(
                `✅ MENU SENT TO ${sender}`
            )

        } catch (error) {

            console.log(
                '❌ MENU ERROR:'
            )

            console.log(error)

            try {

                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text:
                            '❌ Failed to load menu.'
                    }
                )

            } catch {}
        }
    },

    //========================================
    // REPLY HANDLER
    //========================================

    async replyHandler(
        sock,
        msg
    ) {

        try {

            const from =
                msg.key?.remoteJid

            if (!from) return

            const sender = (
                msg.key?.participant ||
                msg.key?.remoteJid ||
                ''
            ).split(':')[0]

            const replyData =
                global.menuReplies[
                    sender
                ]

            if (!replyData) {
                return
            }

            //========================================
            // SAFE QUOTED DETECTION
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
                quoted !== replyData.key
            ) {
                return
            }

            //========================================
            // GET REPLY TEXT
            //========================================

            const body =
                getBody(msg)

            if (!body) {
                return
            }

            const text =
                body.trim()

            const prefix =
                replyData.prefix

            //========================================
            // GROUPED MENUS
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
┃ ${prefix}promote
┃ ${prefix}mute
┃ ${prefix}nsfw
┃ ${prefix}antilink
┃ ${prefix}kick
╰━━━━━━━━━━━━━━━━━━⬣
`,

                '4': `
╭━━━〔 🔎 SEARCH MENU 〕━━━⬣
┃ ${prefix}weather
┃ ${prefix}news
┃ ${prefix}npm
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
┃ ${prefix}tts
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
                menus[text]

            if (!response) {
                return
            }

            //========================================
            // SEND GROUP MENU
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
                `✅ MENU REPLY: ${text}`
            )

        } catch (error) {

            console.log(
                '❌ MENU REPLY ERROR:'
            )

            console.log(error)
        }
    }
}
