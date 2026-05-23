const axios = require('axios')
const settings = require('../settings')

module.exports = {
    name: 'npm',

    async execute(sock, msg, args) {

        const from = msg.key.remoteJid

        try {

            // VALIDATE ARGS
            if (
                !Array.isArray(args)
            ) {
                args = []
            }

            const query =
                args.join(' ').trim()

            // CHECK QUERY
            if (!query) {

                return await sock.sendMessage(from, {
                    text:
`╭━━━〔 📦 NPM SEARCH 〕━━━⬣
┃
┃ ❌ Please provide a package name.
┃
┣━━〔 📌 EXAMPLE 〕━━⬣
┃ .npm axios
┃ .npm express
┃ .npm baileys
┃
╰━━━━━━━━━━━━━━━━⬣`
                })
            }

            // QUERY LIMIT
            if (query.length > 100) {

                return await sock.sendMessage(from, {
                    text:
`❌ Query is too long.`
                })
            }

            // LOADING MESSAGE
            await sock.sendMessage(from, {
                text:
`🔎 SEARCHING NPM PACKAGE...

⏳ Please wait...`
            })

            // API REQUEST
            const response = await axios.get(
                `https://registry.npmjs.org/${encodeURIComponent(query)}`,
                {
                    timeout: 30000,
                    validateStatus: () => true,
                    headers: {
                        Accept: 'application/json'
                    }
                }
            )

            // CHECK RESPONSE
            if (
                !response ||
                response.status !== 200
            ) {

                return await sock.sendMessage(from, {
                    text:
`❌ Package not found.`
                })
            }

            const data = response.data

            // VALIDATE DATA
            if (
                !data ||
                typeof data !== 'object'
            ) {

                return await sock.sendMessage(from, {
                    text:
`❌ Invalid npm response.`
                })
            }

            // PACKAGE DETAILS
            const latest =
                data['dist-tags']?.latest ||
                'Unknown'

            const versionData =
                data.versions?.[latest] || {}

            const description =
                typeof data.description === 'string'
                    ? data.description
                    : 'No description available.'

            const author =
                versionData.author?.name ||
                versionData.author ||
                'Unknown'

            const license =
                versionData.license ||
                'Unknown'

            const homepage =
                versionData.homepage ||
                'Not Available'

            const repository =
                versionData.repository?.url ||
                'Not Available'

            const packageLink =
`https://www.npmjs.com/package/${encodeURIComponent(data.name)}`

            // FINAL MESSAGE
            const text =
`╭━━━〔 📦 NPM PACKAGE 〕━━━⬣
┃
┣━━〔 📄 DETAILS 〕━━⬣
┃ 📌 Name: ${data.name}
┃ 🏷 Version: ${latest}
┃ 👤 Author: ${author}
┃ 📜 License: ${license}
┃
┣━━〔 📝 DESCRIPTION 〕━━⬣
┃ ${description}
┃
┣━━〔 🌐 LINKS 〕━━⬣
┃ 🔗 Package:
┃ ${packageLink}
┃
┃ 💻 Repository:
┃ ${repository}
┃
┃ 🌍 Homepage:
┃ ${homepage}
┃
╰━━━━━━━━━━━━━━━━⬣

${settings.footer}
`

            // SEND MESSAGE
            await sock.sendMessage(from, {
                text
            })

        } catch (error) {

            console.log(
                'NPM Command Error:',
                error
            )

            try {

                await sock.sendMessage(from, {
                    text:
`❌ Failed to fetch npm package.`
                })

            } catch {}
        }
    }
}