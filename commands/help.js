const fs = require('fs')
const path = require('path')

let settings = {}

try {

    settings = require('../settings')

} catch {

    settings = {}
}

const dbPath = path.join(
    __dirname,
    '../database/database.json'
)

module.exports = {
    name: 'help',

    async execute(sock, msg, args) {

        const from =
            msg?.key?.remoteJid

        try {

            if (
                !from ||
                typeof from !== 'string'
            ) {
                return
            }

            let prefix = '.'

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
                            db &&
                            typeof db ===
                                'object' &&
                            typeof db.prefix ===
                                'string'
                        ) {

                            prefix =
                                db.prefix
                        }
                    }
                }

            } catch (dbError) {

                console.log(
                    'Database Read Error:',
                    dbError
                )
            }

            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            const command =
                args.join(' ')
                    .trim()
                    .toLowerCase()

            const commands = {

                ping:
                    'Checks bot response speed.',

                alive:
                    'Shows bot online status.',

                runtime:
                    'Displays bot runtime.',

                uptime:
                    'Shows uptime duration.',

                owner:
                    'Displays owner information.',

                repo:
                    'Shows repository link.',

                profile:
                    'Displays your profile info.',

                menu:
                    'Displays full command menu.',

                help:
                    'Shows command help menu.',

                quote:
                    'Sends random quotes.',

                joke:
                    'Sends random jokes.',

                fact:
                    'Sends random facts.',

                image:
                    'Searches images.',

                anime:
                    'Searches anime details.',

                movie:
                    'Searches movie details.',

                song:
                    'Searches song details.',

                play:
                    'Downloads audio/music.',

                video:
                    'Downloads videos.',

                apk:
                    'Searches APK files.',

                pinterest:
                    'Searches Pinterest images.',

                npm:
                    'Searches npm packages.',

                news:
                    'Gets latest news.',

                weather:
                    'Gets weather updates.',

                sticker:
                    'Creates stickers.',

                tourl:
                    'Uploads media to URL.',

                toimg:
                    'Converts sticker to image.',

                shorturl:
                    'Shortens long URLs.',

                translate:
                    'Translates text.',

                calculate:
                    'Performs calculations.',

                ai:
                    'AI chatbot command.',

                tagall:
                    'Mentions all group members.',

                promote:
                    'Promotes group members.',

                kick:
                    'Removes group members.',

                mute:
                    'Locks group chatting.',

                nsfw:
                    'Enable or disable NSFW.',

                setname:
                    'Changes bot profile name.',

                setbio:
                    'Changes bot bio.',

                setbotdp:
                    'Changes bot profile photo.',

                setprefix:
                    'Changes command prefix.'
            }

            if (command) {

                if (
                    !commands[command]
                ) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`╭━━━〔 ❌ COMMAND NOT FOUND 〕━━━⬣
┃
┃ Command:
┃ ${prefix}${command}
┃
┃ Status:
┃ Invalid command name.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        }
                    )
                }

                const singleHelp =
`╭━━━〔 📖 COMMAND HELP 〕━━━⬣
┃
┃ 🔹 Command:
┃ ${prefix}${command}
┃
┣━━━━━━━━━━━━━━━━⬣
┃
┃ 📝 Description:
┃ ${commands[command]}
┃
┣━━━━━━━━━━━━━━━━⬣
┃
┃ ⚡ Example:
┃ ${prefix}${command}
┃
╰━━━━━━━━━━━━━━━━━━⬣`

                return await sock.sendMessage(
                    from,
                    {
                        text:
                            singleHelp
                    }
                )
            }

            const helpText =
`╭━━━〔 🤖 NOX SPARROW HELP 〕━━━⬣
┃
┃ 👋 Welcome To Help Menu
┃ ⚡ Prefix: ${prefix}
┃ 📚 Total Commands: 30+
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
┃ ${prefix}profile
┃ ${prefix}setname
┃ ${prefix}setbio
┃ ${prefix}setbotdp
┃ ${prefix}setprefix
┃
┣━━〔 👥 GROUP MENU 〕━━⬣
┃ ${prefix}tagall
┃ ${prefix}promote
┃ ${prefix}kick
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
┃ ${prefix}image
┃ ${prefix}pinterest
┃
┣━━〔 📥 DOWNLOAD MENU 〕━━⬣
┃ ${prefix}play
┃ ${prefix}video
┃ ${prefix}apk
┃ ${prefix}tiktok
┃ ${prefix}instagram
┃ ${prefix}facebook
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
┃ ${prefix}ai
┃
╰━━━━━━━━━━━━━━━━━━⬣

📌 Example:
${prefix}help ping`

            try {

                if (
                    settings &&
                    typeof settings.botImage ===
                        'string' &&
                    settings.botImage.startsWith(
                        'http'
                    )
                ) {

                    await sock.sendMessage(
                        from,
                        {
                            image: {
                                url:
                                    settings.botImage
                            },
                            caption:
                                helpText
                        }
                    )

                } else {

                    await sock.sendMessage(
                        from,
                        {
                            text:
                                helpText
                        }
                    )
                }

            } catch (sendError) {

                console.log(
                    'Help Send Error:',
                    sendError
                )

                await sock.sendMessage(
                    from,
                    {
                        text:
                            helpText
                    }
                )
            }

        } catch (error) {

            console.log(
                'Help Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━━〔 ❌ HELP ERROR 〕━━━⬣
┃
┃ Failed to display
┃ help menu.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}