module.exports = {
name: 'profile',
async execute(sock,m,args){
const from = m.key.remoteJid
const sender = m.key.participant || from

try {
const pp = await sock.profilePictureUrl(sender,'image')

await sock.sendMessage(from,{
image:{ url: pp },
caption:'Your Profile Picture'
})
} catch {
await sock.sendMessage(from,{ text:'No profile picture found' })
}
}
}