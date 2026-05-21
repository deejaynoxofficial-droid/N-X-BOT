module.exports = {
name: 'kick',
async execute(sock,m,args){
const from = m.key.remoteJid

if(!from.endsWith('@g.us')) return

const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]

if(!target){
return sock.sendMessage(from,{ text:'Mention user to kick' })
}

await sock.groupParticipantsUpdate(from,[target],'remove')
}
}