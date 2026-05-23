const axios = require('axios')

let settings = {}

try {

    settings = require('../settings')

} catch {

    settings = {}
}

module.exports = {
    name: 'chatbot',

    async execute(sock, msg, args) {

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

            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            const question =
                args.join(' ').trim()

            const quickReplies = {

                hi: [
                    '👋 Hello!',
                    '👋 Hi there!',
                    '👋 Hey!'
                ],

                hello: [
                    '👋 Hello!',
                    '😊 Nice to meet you!',
                    '👋 Hi there!'
                ],

                bye: [
                    '👋 Goodbye!',
                    '😊 See you later!',
                    '👋 Take care!'
                ],

                thanks: [
                    '😊 You are welcome!',
                    '👍 Glad to help!',
                    '😄 Anytime!'
                ],

                owner: [
                    '👑 My owner is awesome!',
                    '👑 I was created by my developer.',
                    '👑 Respect my owner.'
                ],

                joke: [
                    '😂 Why did the computer get cold? Because it forgot to close its Windows.',
                    '😂 I would tell you a UDP joke, but you might not get it.',
                    '😂 Why do programmers prefer dark mode? Because light attracts bugs.'
                ],

                bot: [
                    '🤖 Yes, I am a WhatsApp bot.',
                    '🤖 I am online and active.',
                    '🤖 Ready to help you!'
                ]
            }

            if (!question) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 🤖 CHATBOT 〕━━⬣
┃
┃ Example:
┃ .chatbot hello
┃ .chatbot joke
┃ .chatbot who are you
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                question.length > 500
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Message is too long.
┃
┃ Maximum:
┃ 500 characters.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const lowerQuestion =
                question.toLowerCase()

            if (
                quickReplies[
                    lowerQuestion
                ]
            ) {

                const replies =
                    quickReplies[
                        lowerQuestion
                    ]

                const randomReply =
                    replies[
                        Math.floor(
                            Math.random() *
                            replies.length
                        )
                    ]

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 🤖 CHATBOT 〕━━⬣
┃
┃ ${randomReply}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !settings ||
                typeof settings !==
                    'object'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ CONFIG ERROR 〕━━⬣
┃
┃ Settings configuration
┃ is missing.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !settings.APIs ||
                typeof settings.APIs.neoxr !==
                    'string'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ Chatbot API is
┃ not configured.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                typeof settings.apiKey !==
                    'string' ||
                settings.apiKey.trim() ===
                    ''
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ API key is missing.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            await sock.sendMessage(
                from,
                {
                    text:
`╭━━〔 🤖 CHATBOT 〕━━⬣
┃
┃ Thinking...
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                }
            )

            const apiUrl =
`${settings.APIs.neoxr}/api/chatbot?text=${encodeURIComponent(question)}&apikey=${encodeURIComponent(settings.apiKey)}`

            let response = null

            try {

                response =
                    await axios.get(
                        apiUrl,
                        {
                            timeout: 30000,
                            maxRedirects: 5,
                            validateStatus:
                                () => true,
                            headers: {
                                Accept:
                                    'application/json',
                                'User-Agent':
                                    'Mozilla/5.0'
                            }
                        }
                    )

            } catch (apiError) {

                console.log(
                    'API Request Error:',
                    apiError
                )

                const offlineReplies = [

                    '🤖 AI server unavailable.',

                    '⚠️ Chatbot service offline.',

                    '❌ Failed to connect to chatbot API.',

                    '🌐 Network connection issue.',

                    '🔄 Please try again later.'
                ]

                const randomOffline =
                    offlineReplies[
                        Math.floor(
                            Math.random() *
                            offlineReplies.length
                        )
                    ]

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ CHATBOT ERROR 〕━━⬣
┃
┃ ${randomOffline}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                !response ||
                typeof response !==
                    'object'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ Invalid API response.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            if (
                response.status !== 200
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ API returned:
┃ ${response.status}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const body =
                response.data

            if (
                !body ||
                typeof body !==
                    'object'
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ API ERROR 〕━━⬣
┃
┃ Malformed API
┃ response received.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const reply =
                typeof body.data ===
                'string'
                    ? body.data.trim()
                    : null

            if (
                !reply ||
                reply.length === 0
            ) {

                return await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ⚠️ EMPTY RESPONSE 〕━━⬣
┃
┃ AI returned no reply.
┃
┃ Try another question.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )
            }

            const safeReply =
                reply.length > 4000
                    ? reply.slice(0, 4000)
                    : reply

            await sock.sendMessage(
                from,
                {
                    text:
`╭━━〔 🤖 CHATBOT RESPONSE 〕━━⬣
┃
┃ ${safeReply}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                }
            )

        } catch (error) {

            console.log(
                'Chatbot Command Error:',
                error
            )

            try {

                await sock.sendMessage(
                    from,
                    {
                        text:
`╭━━〔 ❌ ERROR 〕━━⬣
┃
┃ Failed to process
┃ chatbot request.
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                    }
                )

            } catch {}
        }
    }
}