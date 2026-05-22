const axios = require("axios")

module.exports = {
name: "song",

async execute(sock, m, args) {

const query = args.join(" ")

if (!query) {

return sock.sendMessage(
m.chat,
{
text: "Example:\n.song Calm Down"
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
text: "🔍 Searching song..."
},
{ quoted: m }
)

const search = await axios.get(
`https://apis-samir.onrender.com/search/yts?query=${query}`
)

const video = search.data.results[0]

await sock.sendMessage(
m.chat,
{
text: `🎵 Found:\n${video.title}`
},
{ quoted: m }
)

const download = await axios.get(
`${API_BASE}/download/ytaudio?url=${video.url}`
)

await sock.sendMessage(
m.chat,
{
audio: { url: download.data.result.download_url },
mimetype: "audio/mpeg"
},
{ quoted: m }
)

}
}