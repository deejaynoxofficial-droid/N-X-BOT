const settings = require("../../settings")

module.exports = {
name: "alive",

async execute(sock, m) {

await sock.sendMessage(
m.chat,
{
text: `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ ✅ 𝙽𝙾𝚇 𝚂𝙿𝙰𝚁𝚁𝙾𝚆 𝙱𝙾𝚃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

┃ 🤖 Bot: ${settings.botName}
┃ 🚀 Status: Online
┃ ⚡ Mode: ${settings.mode}
┃ 📱 Device: Multi Device

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 👑 ${settings.footerName}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`
},
{ quoted: m }
)

}
}