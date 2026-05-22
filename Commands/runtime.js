function runtime(seconds) {

seconds = Number(seconds)

const d =
Math.floor(seconds / (3600 * 24))

const h =
Math.floor(seconds % (3600 * 24) / 3600)

const m =
Math.floor(seconds % 3600 / 60)

const s =
Math.floor(seconds % 60)

return `${d}d ${h}h ${m}m ${s}s`

}

module.exports = {
name: "runtime",

async execute(sock, m) {

const run = runtime(process.uptime())

await sock.sendMessage(
m.chat,
{
text: `⏳ Runtime: ${run}`
},
{ quoted: m }
)

}
}