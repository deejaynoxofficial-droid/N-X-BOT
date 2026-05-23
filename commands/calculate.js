module.exports = {
    name: 'calculate',

    async execute(sock, msg, args) {

        const from = msg.key.remoteJid

        try {

            // VALIDATE ARGS
            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            const expression =
                args.join(' ').trim()

            // CHECK INPUT
            if (!expression) {

                return await sock.sendMessage(from, {
                    text:
`╭━━━〔 🧮 CALCULATOR 〕━━━⬣
┃
┃ ❌ Please provide a calculation.
┃
┣━━〔 📌 EXAMPLES 〕━━⬣
┃ .calculate 5 + 5
┃ .calculate 10 * 8
┃ .calculate 100 / 4
┃ .calculate (5 + 5) * 2
┃
╰━━━━━━━━━━━━━━━━⬣`
                })
            }

            // VALIDATE EXPRESSION
            const validExpression =
                /^[0-9+\-*/().%\s]+$/.test(
                    expression
                )

            if (!validExpression) {

                return await sock.sendMessage(from, {
                    text:
`❌ Invalid calculation expression.`
                })
            }

            let result = null

            try {

                result = eval(expression)

            } catch {

                return await sock.sendMessage(from, {
                    text:
`❌ Failed to calculate expression.`
                })
            }

            // CHECK RESULT
            if (
                result === undefined ||
                result === null ||
                Number.isNaN(result)
            ) {

                return await sock.sendMessage(from, {
                    text:
`❌ Invalid calculation result.`
                })
            }

            // FINAL RESPONSE
            const text =
`╭━━━〔 🧮 CALCULATOR 〕━━━⬣
┃
┣━━〔 📥 INPUT 〕━━⬣
┃ ${expression}
┃
┣━━〔 📤 RESULT 〕━━⬣
┃ ${result}
┃
╰━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(from, {
                text
            })

        } catch (error) {

            console.log(
                'Calculate Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`❌ Failed to execute calculator.`
                })

            } catch {}
        }
    }
}