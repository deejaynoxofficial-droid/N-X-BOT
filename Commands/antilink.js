const antiLinkGroups = []

module.exports = {
name: "antilink",
antiLinkGroups,

async execute(sock, m, args) {

if (!args[0]) {

return sock.sendMessage(
m.chat,
{
text: "Usage: .antilink on/off"
},
{ quoted: m }
)

}

if (args[0] === "on") {

if (!antiLinkGroups.includes(m.chat)) {
antiLinkGroups.push(m.chat)
}

await sock.sendMessage(
m.chat,
{
text: "✅ Anti-link enabled."
},
{ quoted: m }
)

} else if (args[0] === "off") {

let index = antiLinkGroups.indexOf(m.chat)

if (index !== -1) {
antiLinkGroups.splice(index, 1)
}

await sock.sendMessage(
m.chat,
{
text: "❌ Anti-link disabled."
},
{ quoted: m }
)

}

}
}