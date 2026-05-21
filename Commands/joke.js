module.exports = {
name: 'joke',
async execute(sock,m,args){
const from = m.key.remoteJid

const jokes = [
'Programmers never sleep',
'Bug fixes create new bugs',
'JavaScript is magic'
]

const random = jokes[Math.floor(Math.random()*jokes.length)]

await sock.sendMessage(from,{ text: random })
}
}