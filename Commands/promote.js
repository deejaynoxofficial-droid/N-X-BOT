module.exports = {
name: "promote",

async execute(sock, m) {

if (!m.quoted) {
return sock.sendMessage(
m.chat,
{
text: "Reply to a member to promote."
},
{ quoted: m }
)
}

const user = m.quoted.sender

await sock.groupParticipantsUpdate(
m.chat,
[user],
"promote"
)

await sock.sendMessage(
m.chat,
{
text: `✅ Successfully promoted @${user.split("@")[0]}`,
mentions: [user]
},
{ quoted: m }
)

}
}