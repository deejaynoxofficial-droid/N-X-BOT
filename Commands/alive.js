module.exports = {
name: 'alive',
async execute(sock,m,args,{ BOTNAME }) {
const from = m.key.remoteJid

await sock.sendMessage(from,{ text:`${BOTNAME} is active and running successfully` })
}
}
