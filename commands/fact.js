const settings = require('../settings')

module.exports = {
    name: 'fact',

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

            const facts = [

                'Honey never spoils.',
                'Bananas are berries, but strawberries are not.',
                'Octopuses have three hearts.',
                'Sharks existed before trees.',
                'A group of flamingos is called a flamboyance.',
                'The Eiffel Tower can grow taller in summer.',
                'Some turtles can breathe through their butts.',
                'There are more stars in space than grains of sand on Earth.',
                'Wombat poop is cube-shaped.',
                'A day on Venus is longer than a year on Venus.',

                'Cats can make over 100 vocal sounds.',
                'Water can boil and freeze at the same time.',
                'The human brain contains around 86 billion neurons.',
                'Cows have best friends.',
                'Sloths can hold their breath longer than dolphins.',
                'The heart of a shrimp is in its head.',
                'Koalas sleep up to 22 hours a day.',
                'The inventor of the microwave discovered it by accident.',
                'An eagle can see about 8 times better than humans.',
                'Hot water freezes faster than cold water under certain conditions.'
            ]

            // VALIDATE FACTS
            const validFacts =
                facts.filter(
                    fact =>
                        typeof fact === 'string' &&
                        fact.trim() !== ''
                )

            if (
                validFacts.length === 0
            ) {

                return await sock.sendMessage(from, {
                    text:
                        '❌ No facts available.'
                })
            }

            // RANDOM FACT
            const randomIndex =
                Math.floor(
                    Math.random() *
                    validFacts.length
                )

            const selectedFact =
                validFacts[randomIndex]

            // FINAL MESSAGE
            const responseText =
`╭━━━〔 🧠 RANDOM FACT 〕━━━⬣
┃
┃ ${selectedFact}
┃
╰━━━━━━━━━━━━━━━━━━⬣

${settings.footer}`

            // SEND MESSAGE
            await sock.sendMessage(from, {
                text:
                    responseText
            })

        } catch (error) {

            console.log(
                'Fact Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
                        '❌ Failed to fetch fact.'
                })

            } catch {}
        }
    }
}