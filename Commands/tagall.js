module.exports = {
name: 'tagall',
async execute(sock,m,args){
const from = m.key.remoteJid

if(!from.endsWith('@g.us')) return

const metadata = await sock.groupMetadata(from)
const participants = metadata.participants

let text = 'GROUP MEMBERS

'
let mentions = []

for(let p of participants){
text += `@${p.id.split('@')[0]}
`
mentions.push(p.id)
}

await sock.sendMessage(from,{ text, mentions })
}
}