const fs = require("fs")
const settings = require("./settings")

async function groupMenu(sock, from, pushname) {

const menuImage =
fs.existsSync(settings.botImage)
? fs.readFileSync(settings.botImage)
: null

const menuText = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 👥 GROUP MENU
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 👤 User: ${pushname}
┃ ⚡ Prefix: ${settings.prefix}
┃ 🌐 Mode: ${settings.mode}
┃ 📱 Device: Multi Device
┃ 🚀 Status: Online
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╭━━━〔𝙽𝙾𝚇 𝚂𝙿𝙰𝚁𝚁𝙾𝚆 𝙱𝙾𝚃〕━━⬣

┃ 👥 ${settings.prefix}tagall
┃ ⬆️ ${settings.prefix}promote
┃ ⬇️ ${settings.prefix}demote
┃ 🔗 ${settings.prefix}antilink
┃ 🕵️ ${settings.prefix}hidetag
┃ ➕ ${settings.prefix}add
┃ ❌ ${settings.prefix}kick
┃ 👋 ${settings.prefix}welcome
┃ 📴 ${settings.prefix}goodbye

╰━━━━━━━━━━━━━━━━━━⬣━━━━━━━━━━━━━⬣

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔗 Channel:
┃ ${settings.channelLink}
┃
┃ 👑 ${settings.footerName}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`

if (menuImage) {

await sock.sendMessage(
from,
{
image: menuImage,
caption: menuText
}
)

} else {

await sock.sendMessage(
from,
{
text: menuText
}
)

}

}

module.exports = {
groupMenu
}