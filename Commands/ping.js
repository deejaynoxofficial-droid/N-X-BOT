module.exports = {
name: "ping",

async execute(sock, m) {

const start = Date.now()

const end = Date.now()

const speed = end - start

await sock.sendMessage(
m.chat,
{
text: `🏓 Pong\n⚡ Speed: ${speed}ms`
},
{ quoted: m }
)

}
}