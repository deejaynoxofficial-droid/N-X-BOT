module.exports = {
name: "hidetag",

async execute(sock, m, args, participants) {

const text = args.join(" ")

await sock.sendMessage(
m.chat,
{
text: text || "Hidden Tag Message",
mentions: participants.map(a => a.id)
},
{ quoted: m }
)

}
}