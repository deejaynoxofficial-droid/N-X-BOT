module.exports = {
name: "add",

async execute(sock, m, args) {

if (!args[0]) {
return sock.sendMessage(
m.chat,
{
text: "Provide a number to add."
},
{ quoted: m }
)
}

const user = args[0] + "@s.whatsapp.net"

await sock.groupParticipantsUpdate(
m.chat,
[user],
"add"
)

await sock.sendMessage(
m.chat,
{
text: `✅ Added @${args[0]}`,
mentions: [user]
},
{ quoted: m }
)

}
}