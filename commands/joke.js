const settings = require('../settings')

module.exports = {
    name: 'joke',

    async execute(sock, msg) {

        const from =
            msg?.key?.remoteJid

        try {

            if (
                !from ||
                typeof from !== 'string'
            ) {
                return
            }

            const jokes = [

                "Why don’t skeletons fight each other? They don’t have the guts.",
                "Why did the scarecrow win an award? Because he was outstanding in his field.",
                "Why did the math book look sad? Because it had too many problems.",
                "Why don’t eggs tell jokes? They’d crack each other up.",
                "What do you call fake spaghetti? An impasta.",
                "Why did the bicycle fall over? Because it was two-tired.",
                "Why did the golfer bring two pants? In case he got a hole in one.",
                "Why can’t your nose be 12 inches long? Because then it would be a foot.",
                "Why did the coffee file a police report? It got mugged.",
                "What do you call cheese that isn’t yours? Nacho cheese.",

                "Why did the tomato blush? Because it saw the salad dressing.",
                "Why don’t programmers like nature? Too many bugs.",
                "Why was six afraid of seven? Because seven ate nine.",
                "Why did the computer go to therapy? Too many bytes of trauma.",
                "Why did the cookie go to the doctor? Because it felt crummy.",
                "What kind of tree fits in your hand? A palm tree.",
                "Why did the banana go to the hospital? It wasn’t peeling well.",
                "Why did the student eat his homework? Because the teacher said it was a piece of cake.",
                "What do you call a sleeping bull? A bulldozer.",
                "Why did the fish blush? Because it saw the ocean’s bottom."
            ]

            // VALIDATE JOKES
            const validJokes =
                jokes.filter(
                    joke =>
                        typeof joke === 'string' &&
                        joke.trim() !== ''
                )

            if (
                validJokes.length === 0
            ) {

                return await sock.sendMessage(from, {
                    text:
                        '❌ No jokes available.'
                })
            }

            // RANDOM JOKE
            const randomIndex =
                Math.floor(
                    Math.random() *
                    validJokes.length
                )

            const selectedJoke =
                validJokes[randomIndex]

            // FINAL MESSAGE
            const responseText =
`╭━━━〔 😂 RANDOM JOKE 〕━━━⬣
┃
┃ ${selectedJoke}
┃
╰━━━━━━━━━━━━━━━━━━⬣

${settings.footer}`

            // SEND MESSAGE
            await sock.sendMessage(from, {
                text: responseText
            })

        } catch (error) {

            console.log(
                'Joke Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
                        '❌ Failed to fetch joke.'
                })

            } catch {}
        }
    }
}