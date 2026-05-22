let goodbyeMessage = "👋 Goodbye, we will miss you!"

module.exports = {
name: "goodbye",

async execute(sock, m, args) {

const text = args.join(" ")

if (!text) {

return sock.sendMessage(
m.chat,
{
text: "Provide a goodbye message."
},
{ quoted: m }
)

}

goodbyeMessage = text

await sock.sendMessage(
m.chat,
{
text: `✅ Goodbye message updated:\n\n${goodbyeMessage}`
},
{ quoted: m }
)

}
}