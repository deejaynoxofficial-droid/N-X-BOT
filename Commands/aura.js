module.exports = {
name: 'aura',
async execute(sock,m,args){
const from = m.key.remoteJid

const aura = Math.floor(Math.random()*10000)

await sock.sendMessage(from,{ text:`Aura Level: ${aura}` })
}
}