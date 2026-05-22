const fs = require("fs")
const settings = require("./settings")

async function mainMenu(sock, from, pushname) {

const menuImage =
fs.existsSync(settings.botImage)
? fs.readFileSync(settings.botImage)
: null

const menuText = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🤖 ${settings.botName}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 👤 User: ${pushname}
┃ ⚡ Prefix: ${settings.prefix}
┃ 🌐 Mode: ${settings.mode}
┃ 📱 Device: Multi Device
┃ 🚀 Status: Online
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╭━━━〔𝙽𝙾𝚇 𝚂𝙿𝙰𝚁𝚁𝙾𝚆 𝙱𝙾𝚃〕━━⬣

┃ 1️⃣ Main Menu
┃ 2️⃣ Group Menu
┃ 3️⃣ Fun Menu
┃ 4️⃣ AI Menu
┃ 5️⃣ Tools Menu
┃ 6️⃣ Download Menu
┃ 7️⃣ Owner Menu

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
mainMenu
}