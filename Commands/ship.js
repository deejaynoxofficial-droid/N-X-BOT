module.exports = {
name: 'ship',
async execute(sock,m,args){
const from = m.key.remoteJid

if(!from.endsWith('@g.us')) return

const metadata = await sock.groupMetadata(from)
const participants = metadata.participants

const p1 = participants[Math.floor(Math.random()*participants.length)].id
const p2 = participants[Math.floor(Math.random()*participants.length)].id

const score = Math.floor(Math.random()*100)

await sock.sendMessage(from,{
text:`LOVE MATCH

@${p1.split('@')[0]} ❤️ @${p2.split('@')[0]}

Compatibility: ${score}%`,
mentions:[p1,p2]
})
}
}