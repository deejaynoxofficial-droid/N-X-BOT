const os = require('os')
const fs = require('fs')
const settings = require('../settings')

//========================================
// SAFE RUNTIME FUNCTION
//========================================

function runtime(seconds) {

    seconds = Number(seconds)

    const d =
        Math.floor(seconds / (3600 * 24))

    const h =
        Math.floor(
            seconds % (3600 * 24) / 3600
        )

    const m =
        Math.floor(
            seconds % 3600 / 60
        )

    const s =
        Math.floor(
            seconds % 60
        )

    return [

        d > 0
            ? d + 'd'
            : '',

        h > 0
            ? h + 'h'
            : '',

        m > 0
            ? m + 'm'
            : '',

        s > 0
            ? s + 's'
            : ''

    ]
    .filter(Boolean)
    .join(' ')
}

//========================================
// COMMAND
//========================================

module.exports = {

    name: 'alive',

    aliases: [
        'online',
        'botstatus'
    ],

    async execute(
        sock,
        msg
    ) {

        const from =
            msg.key.remoteJid

        try {

            const ramUsed =

                (
                    process.memoryUsage()
                        .heapUsed /
                    1024 /
                    1024
                ).toFixed(2)

            const totalRam =

                (
                    os.totalmem() /
                    1024 /
                    1024 /
                    1024
                ).toFixed(2)

            const response = `
╭━━━〔 🤖 BOT STATUS 〕━━━⬣
┃
┃ ✅ Status: ONLINE
┃ ⚡ Runtime: ${runtime(process.uptime())}
┃ 💾 RAM Usage: ${ramUsed} MB
┃ 🧠 Total RAM: ${totalRam} GB
┃ 🖥️ Platform: ${os.platform()}
┃ 📦 Version: ${settings.botVersion || '1.0.0'}
┃ 👑 Owner: ${settings.ownerName}
┃
╰━━━━━━━━━━━━━━━━━━⬣

${settings.footer || ''}
`

            //========================================
            // SEND IMAGE
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
                            response
                    }
                )

            }

            //========================================
            // SEND TEXT
            //========================================

            else {

                await sock.sendMessage(
                    from,
                    {
                        text:
                            response
                    }
                )
            }

        }

        catch (error) {

            console.log(
                'Alive Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
                            '❌ Failed to execute alive command.'
                    }
                )

            } catch {}
        }
    }
}
