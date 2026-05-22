module.exports = {
name: "tagall",

async execute(sock, m, args, participants) {

let teks = `╭━━━〔 TAG ALL 〕━━⬣\n\n`

for (let mem of participants) {
teks += `┃ 👤 @${mem.id.split("@")[0]}\n`
}

teks += `\n╰━━━━━━━━━━━━━━━━━━⬣`

await sock.sendMessage(
m.chat,
{
text: teks,
mentions: participants.map(a => a.id)
},
{ quoted: m }
)

}
}