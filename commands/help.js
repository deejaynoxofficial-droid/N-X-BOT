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

    aliases: ['commands'],

    async execute(sock, msg, args = []) {

        try {

            const from =
                msg?.key?.remoteJid

            if (!from) return

            let prefix =
                settings.prefix || '.'

            //========================================
            // LOAD PREFIX FROM DATABASE
            //========================================

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
                            db?.settings?.bot?.prefix
                        ) {

                            prefix =
                                db.settings.bot.prefix
                        }
                    }
                }

            } catch (dbError) {

                console.log(
                    'Database Read Error:',
                    dbError
                )
            }

            const command =
                args.join(' ')
                    .trim()
                    .toLowerCase()

            //========================================
            // COMMAND LIST
            //========================================

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

            //========================================
            // SINGLE HELP
            //========================================

            if (command) {

                if (!commands[command]) {

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

                return await sock.sendMessage(
                    from,
                    {
                        text:
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
                    }
                )
            }

            //========================================
            // FULL HELP MENU
            //========================================

            const helpText =
`╭━━━〔 🤖 NOX SPARROW HELP 〕━━━⬣
┃
┃ 👋 Welcome To Help Menu
┃ ⚡ Prefix: ${prefix}
┃ 📚 Total Commands: ${Object.keys(commands).length}
┃
┣━━〔 ⚙️ MAIN MENU 〕━━⬣
┃ ${prefix}menu
┃ ${prefix}help
┃ ${prefix}ping
┃ ${prefix}alive
┃
┣━━〔 👥 GROUP MENU 〕━━⬣
┃ ${prefix}tagall
┃ ${prefix}kick
┃ ${prefix}mute
┃
┣━━〔 🎭 FUN MENU 〕━━⬣
┃ ${prefix}quote
┃ ${prefix}joke
┃ ${prefix}fact
┃ ${prefix}ai
┃
╰━━━━━━━━━━━━━━━━━━⬣

${settings.footer || ''}
`

            //========================================
            // SEND HELP
            //========================================

            try {

                if (
                    settings.botImage &&
                    fs.existsSync(settings.botImage)
                ) {

                    await sock.sendMessage(
                        from,
                        {
                            image:
                                fs.readFileSync(
                                    settings.botImage
                                ),

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
        }
    }
}
