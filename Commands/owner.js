module.exports = {
name: 'owner',
async execute(sock,m,args){
const from = m.key.remoteJid

await sock.sendMessage(from,{
text:'Developer: Mr Nox Star Bots
WhatsApp: 256748752152'
})
}
}