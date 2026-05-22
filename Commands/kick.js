module.exports = {
name: "kick",

async execute(sock, m) {

if (!m.quoted) {
return sock.sendMessage(
m.chat,
{
text: "Reply to a member to remove."
},
{ quoted: m }
)
}

const user = m.quoted.sender

await sock.groupParticipantsUpdate(
m.chat,
[user],
"remove"
)

await sock.sendMessage(
m.chat,
{
text: `❌ Removed @${user.split("@")[0]}`,
mentions: [user]
},
{ quoted: m }
)

}
}