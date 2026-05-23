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
    name: 'quote',

    async execute(sock, msg) {

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
                    'function'
            ) {
                return
            }

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
                    'Database Error:',
                    dbError
                )
            }

            const quotes = [

                'Success is not final, failure is not fatal.',
                'Dream big and dare to fail.',
                'Stay hungry, stay foolish.',
                'Push yourself beyond limits.',
                'Never stop learning.',
                'Discipline beats motivation.',
                'Hard work pays off.',
                'Believe in yourself.',
                'Small steps every day.',
                'Focus on your goals.',
                'Stay strong and positive.',
                'Be fearless in pursuit.',
                'Create your own future.',
                'Consistency is the key.',
                'Success starts with action.',
                'Do it with passion.',
                'Failure builds character.',
                'Think different.',
                'Your only limit is you.',
                'Great things take time.',
                'Stay humble and kind.',
                'Rise above the storm.',
                'Be better than yesterday.',
                'Never give up easily.',
                'Trust the process.',
                'Learn from mistakes.',
                'Work silently, win loudly.',
                'Every day is a chance.',
                'Stay patient and focused.',
                'Turn pain into power.',
                'Fear kills more dreams.',
                'Success needs sacrifice.',
                'Progress over perfection.',
                'Make today count.',
                'Be proud of yourself.',
                'Positive mind, positive life.',
                'Keep moving forward.',
                'You are capable enough.',
                'Dream it, achieve it.',
                'Start now, not later.',
                'The grind never stops.',
                'Be your own hero.',
                'Strength comes from struggle.',
                'Action creates results.',
                'Hustle with purpose.',
                'Doubt kills more dreams.',
                'Work hard in silence.',
                'Stay loyal to goals.',
                'Nothing worth comes easy.',
                'Success is earned.'
            ]

            if (
                !Array.isArray(quotes) ||
                quotes.length === 0
            ) {

                return sock.sendMessage(
                    from,
                    {
                        text:
                            '❌ No quotes available.'
                    }
                )
            }

            const validQuotes =
                quotes.filter(
                    quote =>
                        typeof quote ===
                            'string' &&
                        quote.trim() !== ''
                )

            if (
                validQuotes.length === 0
            ) {

                return sock.sendMessage(
                    from,
                    {
                        text:
                            '❌ No valid quotes found.'
                    }
                )
            }

            const randomIndex =
                Math.floor(
                    Math.random() *
                    validQuotes.length
                )

            const selectedQuote =
                validQuotes[randomIndex]

            const text =
`╭━━〔 💬 QUOTE OF THE DAY 〕━━⬣
┃
┃ "${selectedQuote}"
┃
┣━━〔 🌟 MOTIVATION 〕━━⬣
┃ Keep pushing forward.
┃ Success starts with action.
┃
┣━━〔 🤖 BOT INFO 〕━━⬣
┃ Prefix: ${prefix}
┃ Status: Active
┃
╰━━━━━━━━━━━━━━━━━━⬣`

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
                                text
                        }
                    )

                } else {

                    await sock.sendMessage(
                        from,
                        {
                            text
                        }
                    )
                }

            } catch (sendError) {

                console.log(
                    'Quote Send Error:',
                    sendError
                )

                await sock.sendMessage(
                    from,
                    {
                        text
                    }
                )
            }

        } catch (error) {

            console.log(
                'Quote Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
                            '❌ Failed to fetch quote.'
                    }
                )

            } catch {}
        }
    }
}