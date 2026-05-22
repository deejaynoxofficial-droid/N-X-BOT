let welcomeMessage = "👋 Welcome to the group!"

module.exports = {
name: "welcome",

async execute(sock, m, args) {

const text = args.join(" ")

if (!text) {

return sock.sendMessage(
m.chat,
{
text: "Provide a welcome message."
},
{ quoted: m }
)

}

welcomeMessage = text

await sock.sendMessage(
m.chat,
{
text: `✅ Welcome message updated:\n\n${welcomeMessage}`
},
{ quoted: m }
)

}
}