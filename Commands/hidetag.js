module.exports = {
name: 'hidetag',
async execute(sock,m,args){
const from = m.key.remoteJid

if(!from.endsWith('@g.us')) return

const metadata = await sock.groupMetadata(from)
const participants = metadata.participants.map(v=>v.id)

const text = args.join(' ') || 'Hidden Tag Message'

await sock.sendMessage(from,{ text, mentions: participants })
}
}