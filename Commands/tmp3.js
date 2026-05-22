const { API_BASE, fetchJson } = require("../../lib/api")

module.exports = {
name: "ytmp3",

async execute(sock, m, args) {

const url = args[0]

if (!url) {

return sock.sendMessage(
m.chat,
{
text: "Example:\n.ytmp3 https://youtube.com/watch?v=xxx"
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
text: "🎧 Downloading audio..."
},
{ quoted: m }
)

const res = await fetchJson(
`${API_BASE}/download/ytaudio?url=${url}`
)

if (!res || !res.result) {

return sock.sendMessage(
m.chat,
{
text: "❌ Failed to download audio."
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
audio: { url: res.result.download_url },
mimetype: "audio/mpeg",
ptt: false
},
{ quoted: m }
)

}
}