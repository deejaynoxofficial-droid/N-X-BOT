const settings = require('../settings')
const {
    requestPairingCode,
    normalizePhone,
    isRegisteredSession
} = require('../sockets/socketManager')

function formatNumber(input) {
    let phone = normalizePhone(input)
    if (phone.startsWith('0') && phone.length === 10) {
        phone = '256' + phone.slice(1)
    }
    return phone
}

module.exports = {
    name: 'pair',
    aliases: ['pairing', 'getpaircode'],
    category: 'owner',
    owner: true,
    description: 'Generate a WhatsApp pairing code for another account',

    async execute(sock, msg, args) {
        const from = msg?.key?.remoteJid
        if (!from) return

        const raw = args?.[0]
        if (!raw) {
            return sock.sendMessage(from, {
                text: `╭━━━〔 📲 PAIRING COMMAND 〕━━━⬣
┃
┃ 🔐 Generate a WhatsApp pairing code.
┃
┃ 📝 Usage:
┃ *.pair 256XXXXXXXXX*
┃
┃ 🇺🇬 Example:
┃ *.pair 2567XXXXXXXX*
┃
┃ ⚠️ Use the full international number.
╰━━━━━━━━━━━━━━━━━━⬣`
            }, { quoted: msg })
        }

        const phone = formatNumber(raw)
        if (phone.length < 10 || phone.length > 15) {
            return sock.sendMessage(from, {
                text: '❌ Invalid phone number. Use the full international number, e.g. 2567XXXXXXXX.'
            }, { quoted: msg })
        }

        if (await isRegisteredSession(phone)) {
            return sock.sendMessage(from, {
                text: `╭━━━〔 ⚠️ ALREADY PAIRED 〕━━━⬣
┃
┃ 📱 Number: ${phone}
┃
┃ This number already has a
┃ registered NOX SPARROW session.
┃
┃ 💡 Use the existing session or
┃ remove it before pairing again.
╰━━━━━━━━━━━━━━━━━━⬣`
            }, { quoted: msg })
        }

        await sock.sendMessage(from, {
            text: `╭━━━〔 ⏳ PAIRING 〕━━━⬣
┃
┃ 📱 Number: ${phone}
┃ 🔄 Preparing WhatsApp link...
┃
┃ Please wait for your pairing code.
╰━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: msg })

        try {
            const result = await requestPairingCode(phone)

            await sock.sendMessage(from, {
                text: `╭━━━〔 🔐 NOX PAIRING CODE 〕━━━⬣
┃
┃ 📱 Number: ${phone}
┃
┃ 🔑 *CODE: ${result.code}*
┃
┣━━〔 📲 NEXT STEP 〕━━⬣
┃
┃ 1️⃣ Open WhatsApp
┃ 2️⃣ Settings → Linked Devices
┃ 3️⃣ Link a Device
┃ 4️⃣ Choose *Link with phone number*
┃ 5️⃣ Enter the code above
┃
┃ ⏳ Complete it before the code expires.
┃
╰━━━━━━━━━━━━━━━━━━⬣

⚡ Powered by ${settings.ownerName || 'NOX STAR.B'}`
            }, { quoted: msg })
        } catch (err) {
            const code = err?.statusCode
            const detail = code ? `WhatsApp error ${code}` : (err?.message || 'Unknown pairing error')
            await sock.sendMessage(from, {
                text: `╭━━━〔 ❌ PAIRING FAILED 〕━━━⬣
┃
┃ 📱 Number: ${phone}
┃
┃ ${detail}
┃
┃ 💡 Try again after checking the
┃ number and WhatsApp connection.
╰━━━━━━━━━━━━━━━━━━⬣`
            }, { quoted: msg })
        }
    }
}
