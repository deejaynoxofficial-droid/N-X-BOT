const { API_BASE, fetchJson } = require("../../lib/api")

module.exports = {
name: "tiktok",

async execute(sock, m, args) {

const url = args[0]

if (!url) {

return sock.sendMessage(
m.chat,
{
text: "Example:\n.tiktok https://vt.tiktok.com/..."
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
text: "📥 Downloading TikTok video..."
},
{ quoted: m }
)

const res = await fetchJson(
`${API_BASE}/download/tiktok?url=${url}`
)

if (!res || !res.result) {

return sock.sendMessage(
m.chat,
{
text: "❌ Failed to fetch video."
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
video: { url: res.result.play },
caption: "✅ TikTok Downloaded"
},
{ quoted: m }
)

}
}