module.exports = {
name: 'menu',
async execute(sock,m,args,{ PREFIX, NOX SPARROW BOT }) {
const from = m.key.remoteJid

const text = `
╭━━━〔 ${NOX SPARROW BOT} 〕━━━⬣
┃ Prefix: ${PREFIX}
┃ Status: Online
╰━━━━━━━━━━━━⬣

╭━━━〔 MAIN 〕━━━⬣
┃ ${PREFIX}ping
┃ ${PREFIX}alive
┃ ${PREFIX}owner
┃ ${PREFIX}menu
╰━━━━━━━━━━━━⬣

╭━━━〔 FUN 〕━━━⬣
┃ ${PREFIX}ship
┃ ${PREFIX}aura
┃ ${PREFIX}joke
┃ ${PREFIX}quote
╰━━━━━━━━━━━━⬣

╭━━━〔 GROUP 〕━━━⬣
┃ ${PREFIX}tagall
┃ ${PREFIX}kick
┃ ${PREFIX}hidetag
╰━━━━━━━━━━━━⬣
`

await sock.sendMessage(from,{ text })
}
}