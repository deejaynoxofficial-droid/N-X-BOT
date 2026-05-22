const { API_BASE, fetchJson } = require("../../lib/api")

module.exports = {
name: "ytmp4",

async execute(sock, m, args) {

const url = args[0]

if (!url) {

return sock.sendMessage(
m.chat,
{
text: "Example:\n.ytmp4 https://youtube.com/watch?v=xxx"
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
text: "🎬 Downloading video..."
},
{ quoted: m }
)

const res = await fetchJson(
`${API_BASE}/download/ytvideo?url=${url}`
)

if (!res || !res.result) {

return sock.sendMessage(
m.chat,
{
text: "❌ Failed to download video."
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
video: { url: res.result.download_url },
caption: "✅ YouTube Video Downloaded"
},
{ quoted: m }
)

}
}