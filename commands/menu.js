const fs = require('fs')

const path = require('path')

const moment = require('moment-timezone')

const settings =
    require('../settings')

//========================================
// DATABASE PATH
//========================================

const dbPath =

    path.join(
        __dirname,
        '../database/database.json'
    )

//========================================
// COMMAND COUNT
//========================================

const commandsPath =

    path.join(
        __dirname,
        '../commands'
    )

const commandFiles =

    fs.readdirSync(commandsPath)
        .filter(
            file =>
                file.endsWith('.js')
        )

//========================================
// MENU STORAGE
//========================================

global.menuReplies =
    global.menuReplies || {}

//========================================
// CLEAN EXPIRED MENUS
//========================================

setInterval(() => {

    try {

        const now =
            Date.now()

        Object.keys(
            global.menuReplies
        ).forEach(key => {

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
// EXPORT
//========================================

module.exports = {

    name: 'menu',

    aliases: [
        'help',
        'allmenu'
    ],

    category: 'main',

    description:
        'Show bot menu',

    async execute(
        sock,
        msg,
        args
    ) {

        try {

            const from =
                msg.key.remoteJid

            if (!from) {
                return
            }

            const sender =

                (
                    msg.key.participant ||
                    msg.key.remoteJid
                )

                    .split(':')[0]

            //========================================
            // PREFIX
            //========================================

            let prefix =
                settings.prefix || '.'

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

                        if (
                            db?.settings?.bot
                                ?.prefix
                        ) {

                            prefix =
                                db.settings
                                    .bot
                                    .prefix
                        }
                    }
                }

            } catch {}

            //========================================
            // USERNAME
            //========================================

            const pushName =

                msg.pushName ||
                'User'

            //========================================
            // TIME
            //========================================

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

            //========================================
            // MAIN MENU
            //========================================

            const menu = `
╭━━━〔 🤖 NOX SPARROW BOT 〕━━━⬣
┃
┃ 👋 User: ${pushName}
┃ ⚡ Prefix: ${prefix}
┃ 📅 Date: ${date}
┃ ⏰ Time: ${time}
┃ 📦 Commands: ${commandFiles.length}
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

${settings.channel || ''}
`

            //========================================
            // SEND MENU
            //========================================

            let sentMessage

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
                        }
                    )

            } else {

                sentMessage =
                    await sock.sendMessage(
                        from,
                        {
                            text: menu
                        }
                    )
            }

            //========================================
            // STORE MENU MESSAGE
            //========================================

            global.menuReplies[
                sender
            ] = {

                key:
                    sentMessage.key.id,

                time:
                    Date.now(),

                prefix
            }

        } catch (error) {

            console.log(
                'MENU ERROR:',
                error
            )

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
                msg.key.remoteJid

            if (!from) {
                return
            }

            const sender =

                (
                    msg.key.participant ||
                    msg.key.remoteJid
                )

                    .split(':')[0]

            const replyData =
                global.menuReplies[
                    sender
                ]

            if (
                !replyData
            ) return

            const quoted =
                msg.message
                    ?.extendedTextMessage
                    ?.contextInfo
                    ?.stanzaId

            if (
                !quoted ||
                quoted !==
                replyData.key
            ) return

            const body =

                msg.message
                    ?.conversation ||

                msg.message
                    ?.extendedTextMessage
                    ?.text ||

                ''

            if (
                !body ||
                typeof body !==
                    'string'
            ) return

            const text =
                body.trim()

            const prefix =
                replyData.prefix

            let response =
                ''

            //========================================
            // MENUS
            //========================================

            if (text === '1') {

                response = `
╭━━━〔 ⚙️ MAIN MENU 〕━━━⬣
┃ ${prefix}menu
┃ ${prefix}ping
┃ ${prefix}alive
┃ ${prefix}runtime
┃ ${prefix}uptime
╰━━━━━━━━━━━━━━━━━━⬣
`
            }

            else if (text === '2') {

                response = `
╭━━━〔 👤 OWNER MENU 〕━━━⬣
┃ ${prefix}owner
┃ ${prefix}repo
┃ ${prefix}setname
┃ ${prefix}setbio
┃ ${prefix}setbotdp
┃ ${prefix}setprefix
╰━━━━━━━━━━━━━━━━━━⬣
`
            }

            else if (text === '3') {

                response = `
╭━━━〔 👥 GROUP MENU 〕━━━⬣
┃ ${prefix}tagall
┃ ${prefix}promote
┃ ${prefix}mute
┃ ${prefix}nsfw
╰━━━━━━━━━━━━━━━━━━⬣
`
            }

            else if (text === '4') {

                response = `
╭━━━〔 🔎 SEARCH MENU 〕━━━⬣
┃ ${prefix}weather
┃ ${prefix}news
┃ ${prefix}npm
┃ ${prefix}movie
┃ ${prefix}anime
┃ ${prefix}song
╰━━━━━━━━━━━━━━━━━━⬣
`
            }

            else if (text === '5') {

                response = `
╭━━━〔 📥 DOWNLOAD MENU 〕━━━⬣
┃ ${prefix}play
┃ ${prefix}video
┃ ${prefix}tiktok
┃ ${prefix}instagram
╰━━━━━━━━━━━━━━━━━━⬣
`
            }

            else if (text === '6') {

                response = `
╭━━━〔 🛠️ TOOLS MENU 〕━━━⬣
┃ ${prefix}sticker
┃ ${prefix}tourl
┃ ${prefix}toimg
┃ ${prefix}translate
╰━━━━━━━━━━━━━━━━━━⬣
`
            }

            else if (text === '7') {

                response = `
╭━━━〔 🎭 FUN MENU 〕━━━⬣
┃ ${prefix}quote
┃ ${prefix}joke
┃ ${prefix}fact
┃ ${prefix}ai
╰━━━━━━━━━━━━━━━━━━⬣
`
            }

            if (!response) {
                return
            }

            await sock.sendMessage(
                from,
                {
                    text: response
                },
                {
                    quoted: msg
                }
            )

        } catch (error) {

            console.log(
                'MENU REPLY ERROR:',
                error
            )
        }
    }
}
