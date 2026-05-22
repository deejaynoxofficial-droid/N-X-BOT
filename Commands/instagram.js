const { API_BASE, fetchJson } = require("../../lib/api")

module.exports = {
name: "instagram",

async execute(sock, m, args) {

const url = args[0]

if (!url) {

return sock.sendMessage(
m.chat,
{
text: "Example:\n.instagram https://instagram.com/..."
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
text: "📸 Downloading Instagram media..."
},
{ quoted: m }
)

const res = await fetchJson(
`${API_BASE}/download/instagram?url=${url}`
)

if (!res || !res.result) {

return sock.sendMessage(
m.chat,
{
text: "❌ Failed to download Instagram media."
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
video: { url: res.result[0].url },
caption: "✅ Instagram Downloaded"
},
{ quoted: m }
)

}
}