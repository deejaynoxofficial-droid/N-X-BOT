module.exports = {
name: "demote",

async execute(sock, m) {

if (!m.quoted) {
return sock.sendMessage(
m.chat,
{
text: "Reply to a member to demote."
},
{ quoted: m }
)
}

const user = m.quoted.sender

await sock.groupParticipantsUpdate(
m.chat,
[user],
"demote"
)

await sock.sendMessage(
m.chat,
{
text: `✅ Successfully demoted @${user.split("@")[0]}`,
mentions: [user]
},
{ quoted: m }
)

}
}