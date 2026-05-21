module.exports = {
name: 'ping',
async execute(sock,m,args){
const from = m.key.remoteJid
const start = Date.now()
const msg = await sock.sendMessage(from,{ text:'Testing speed...' })
const speed = Date.now() - start

await sock.sendMessage(from,{ text:`Pong ${speed}ms`, edit: msg.key })
}
}