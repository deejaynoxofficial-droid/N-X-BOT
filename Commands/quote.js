module.exports = {
name: 'quote',
async execute(sock,m,args){
const from = m.key.remoteJid

const quotes = [
'Never Give Up',
'Dream Big',
'Success Needs Hard Work'
]

const random = quotes[Math.floor(Math.random()*quotes.length)]

await sock.sendMessage(from,{ text: random })
}
}