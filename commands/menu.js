const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')

let settings = {}

try {

    settings = require('../settings')

} catch {

    settings = {}
}

const dbPath = path.join(__dirname, '../database/database.json')

const commandFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.js'))

module.exports = {
    name: 'menu',

    async execute(sock, msg) {

        const from = msg.key.remoteJid

        try {

            let prefix = '.'

            try {

                if (fs.existsSync(dbPath)) {

                    const raw = fs.readFileSync(
                        dbPath,
                        'utf8'
                    )

                    if (raw && raw.trim() !== '') {

                        const db = JSON.parse(raw)

                        if (
                            db &&
                            typeof db === 'object' &&
                            typeof db.prefix === 'string'
                        ) {
                            prefix = db.prefix
                        }
                    }
                }

            } catch (dbError) {

                console.log(
                    'Database Read Error:',
                    dbError
                )
            }

            const pushName =
                typeof msg.pushName === 'string' &&
                msg.pushName.trim() !== ''
                    ? msg.pushName
                    : 'User'

            const date = moment()
                .tz(settings.timezone || 'Africa/Kampala')
                .format('DD/MM/YYYY')

            const time = moment()
                .tz(settings.timezone || 'Africa/Kampala')
                .format('HH:mm:ss')

            const footer =
                typeof settings.footer === 'string'
                    ? settings.footer
                    : ''

            const channel =
                typeof settings.channel === 'string'
                    ? settings.channel
                    : ''

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
┃ ${prefix}help
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
┃ ${prefix}setprefix
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
┃ ${prefix}pinterest
┃ ${prefix}profile
┃
┣━━〔 📥 DOWNLOAD MENU 〕━━⬣
┃ ${prefix}play
┃ ${prefix}video
┃ ${prefix}tiktok
┃ ${prefix}instagram
┃ ${prefix}facebook
┃ ${prefix}apk
┃
┣━━〔 🛠️ TOOLS MENU 〕━━⬣
┃ ${prefix}sticker
┃ ${prefix}tourl
┃ ${prefix}toimg
┃ ${prefix}shorturl
┃ ${prefix}translate
┃ ${prefix}calculate
┃
┣━━〔 🎭 FUN MENU 〕━━⬣
┃ ${prefix}quote
┃ ${prefix}joke
┃ ${prefix}fact
┃ ${prefix}image
┃ ${prefix}hentai
┃ ${prefix}ai
┃
╰━━━━━━━━━━━━━━━━━━⬣

${footer}
${channel}
`

            try {

                if (
                    settings &&
                    typeof settings.botImage === 'string' &&
                    fs.existsSync(settings.botImage)
                ) {

                    await sock.sendMessage(from, {
                        image: fs.readFileSync(settings.botImage),
                        caption: menu
                    })

                } else {

                    await sock.sendMessage(from, {
                        text: menu
                    })
                }

            } catch (sendError) {

                console.log(
                    'Menu Send Error:',
                    sendError
                )

                await sock.sendMessage(from, {
                    text: menu
                })
            }

        } catch (error) {

            console.log(
                'Menu Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text: 'Failed to display menu.'
                })

            } catch {}
        }
    }
}