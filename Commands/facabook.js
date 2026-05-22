const { API_BASE, fetchJson } = require("../../lib/api")

module.exports = {
name: "facebook",

async execute(sock, m, args) {

const url = args[0]

if (!url) {

return sock.sendMessage(
m.chat,
{
text: "Example:\n.facebook https://facebook.com/..."
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
text: "📘 Downloading Facebook video..."
},
{ quoted: m }
)

const res = await fetchJson(
`${API_BASE}/download/facebook?url=${url}`
)

if (!res || !res.result) {

return sock.sendMessage(
m.chat,
{
text: "❌ Failed to download Facebook video."
},
{ quoted: m }
)

}

await sock.sendMessage(
m.chat,
{
video: { url: res.result.hd },
caption: "✅ Facebook Video Downloaded"
},
{ quoted: m }
)

}
}