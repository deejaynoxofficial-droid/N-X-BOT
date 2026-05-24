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
                            db?.prefix
                        ) {

                            prefix =
                                db.prefix
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
            // MENU TEXT
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
┣━━〔 ⚙️ MAIN MENU 〕━━⬣
┃ ${prefix}menu
┃ ${prefix}ping
┃ ${prefix}alive
┃ ${prefix}runtime
┃ ${prefix}uptime
┃
┣━━〔 👤 OWNER MENU 〕━━⬣
┃ ${prefix}owner
┃ ${prefix}repo
┃ ${prefix}setname
┃ ${prefix}setbio
┃ ${prefix}setbotdp
┃
┣━━〔 👥 GROUP MENU 〕━━⬣
┃ ${prefix}tagall
┃ ${prefix}promote
┃ ${prefix}mute
┃ ${prefix}nsfw
┃
┣━━〔 🔎 SEARCH MENU 〕━━⬣
┃ ${prefix}weather
┃ ${prefix}news
┃ ${prefix}npm
┃ ${prefix}movie
┃ ${prefix}anime
┃ ${prefix}song
┃
┣━━〔 📥 DOWNLOAD MENU 〕━━⬣
┃ ${prefix}play
┃ ${prefix}video
┃ ${prefix}tiktok
┃ ${prefix}instagram
┃
┣━━〔 🛠️ TOOLS MENU 〕━━⬣
┃ ${prefix}sticker
┃ ${prefix}tourl
┃ ${prefix}toimg
┃ ${prefix}translate
┃
┣━━〔 🎭 FUN MENU 〕━━⬣
┃ ${prefix}quote
┃ ${prefix}joke
┃ ${prefix}fact
┃ ${prefix}ai
┃
╰━━━━━━━━━━━━━━━━━━⬣

${settings.footer || ''}

${settings.channel || ''}
`

            //========================================
            // SEND IMAGE MENU
            //========================================

            if (
                settings.botImage &&
                fs.existsSync(
                    settings.botImage
                )
            ) {

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

                await sock.sendMessage(
                    from,
                    {
                        text: menu
                    }
                )
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
    }
}
