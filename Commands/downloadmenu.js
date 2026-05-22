const fs = require("fs")
const settings = require("./settings")

async function downloadMenu(sock, from, pushname) {

const menuImage =
fs.existsSync(settings.botImage)
? fs.readFileSync(settings.botImage)
: null

const menuText = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 📥 DOWNLOAD MENU
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 👤 User: ${pushname}
┃ ⚡ Prefix: ${settings.prefix}
┃ 🌐 Mode: ${settings.mode}
┃ 📱 Device: Multi Device
┃ 🚀 Status: Online
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╭━━━〔𝙽𝙾𝚇 𝚂𝙿𝙰𝚁𝚁𝙾𝚆 𝙱𝙾𝚃〕━━⬣

┃ 📦 ${settings.prefix}apk
┃ 🎵 ${settings.prefix}song
┃ 🎬 ${settings.prefix}video
┃ 🎶 ${settings.prefix}play
┃ 🎥 ${settings.prefix}ytmp4
┃ 🎧 ${settings.prefix}ytmp3
┃ 🎵 ${settings.prefix}spotify
┃ 📱 ${settings.prefix}tiktok
┃ 📸 ${settings.prefix}instagram
┃ 📘 ${settings.prefix}facebook

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
downloadMenu
}