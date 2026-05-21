const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidDecode,
  delay,
  Browsers
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const fs = require('fs')
const path = require('path')
const qrcode = require('qrcode-terminal')
const readline = require('readline')
const chalk = require('chalk')
const figlet = require('figlet')
const { Boom } = require('@hapi/boom')
const settings = require('./settings')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (text) => new Promise((resolve) => rl.question(text, resolve))

console.log(
  chalk.cyan(
    figlet.textSync('NOX STAR', {
      horizontalLayout: 'default'
    })
  )
)

const store = makeInMemoryStore({
  logger: pino().child({ level: 'silent', stream: 'store' })
})

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(settings.sessionName)

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.ubuntu('Chrome')
  })

  if (!sock.authState.creds.registered) {
    const phoneNumber = await question(chalk.green('\nEnter WhatsApp Number Example 2567xxxxxxx:\n'))

    const code = await sock.requestPairingCode(phoneNumber)

    console.log(chalk.yellow(`\nYour Pairing Code: ${code}\n`))
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log(chalk.green('\nScan QR Below:\n'))
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode

      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red('Logged Out'))
      } else {
        console.log(chalk.yellow('Reconnecting...'))
        startBot()
      }
    }

    if (connection === 'open') {
      console.log(chalk.green('\nBot Connected Successfully\n'))
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]

    if (!msg.message) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      ''

    const prefix = settings.prefix

    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    const pushname = msg.pushName || 'User'

    const menu = `
╭━━〔 ${settings.NOXSPARROWBOT} 〕━━⬣
┃👤 User: ${pushname}
┃⚡ Prefix: ${prefix}
┃📦 Mode: ${settings.mode}
╰━━━━━━━━━━━━━━⬣

Reply With Number

1. Main Menu
2. Group Menu
3. Fun Menu
4. AI Menu
5. Tools Menu
6. Download Menu
7. Owner Menu
`

    if (command === 'menu') {
      await sock.sendMessage(from, {
        text: menu
      })
    }

    else if (body === '1') {
      await sock.sendMessage(from, {
        text: `
╭━━ MAIN MENU ━━⬣
┃ .ping
┃ .alive
┃ .runtime
┃ .menu
╰━━━━━━━━━━━━⬣
`
      })
    }

    else if (body === '2') {
      await sock.sendMessage(from, {
        text: `
╭━━ GROUP MENU ━━⬣
┃ .kick
┃ .add
┃ .promote
┃ .demote
┃ .tagall
┃ .hidetag
┃ .welcome
┃ .antilink
╰━━━━━━━━━━━━━━⬣
`
      })
    }

    else if (body === '3') {
      await sock.sendMessage(from, {
        text: `
╭━━ FUN MENU ━━⬣
┃ .ship
┃ .joke
┃ .roast
┃ .aura
┃ .truth
╰━━━━━━━━━━━━⬣
`
      })
    }

    else if (body === '4') {
      await sock.sendMessage(from, {
        text: `
╭━━ AI MENU ━━⬣
┃ .ai
┃ .chatgpt
┃ .image
┃ .code
╰━━━━━━━━━━━⬣
`
      })
    }

    else if (body === '5') {
      await sock.sendMessage(from, {
        text: `
╭━━ TOOLS MENU ━━⬣
┃ .font
┃ .qr
┃ .sticker
┃ .pp
┃ .fetch
╰━━━━━━━━━━━━━━⬣
`
      })
    }

    else if (body === '6') {
      await sock.sendMessage(from, {
        text: `
╭━━ DOWNLOAD MENU ━━⬣
┃ .play
┃ .ytmp3
┃ .ytmp4
┃ .tiktok
┃ .facebook
╰━━━━━━━━━━━━━━━━⬣
`
      })
    }

    else if (body === '7') {
      await sock.sendMessage(from, {
        text: `
╭━━ OWNER MENU ━━⬣
┃ .restart
┃ .shutdown
┃ .block
┃ .unblock
┃ .public
┃ .private
╰━━━━━━━━━━━━━━⬣
`
      })
    }

    else if (command === 'ping') {
      const start = Date.now()

      const sent = await sock.sendMessage(from, {
        text: 'Testing Speed...'
      })

      const speed = Date.now() - start

      await sock.sendMessage(from, {
        text: `⚡ Speed: ${speed}ms`,
        edit: sent.key
      })
    }

    else if (command === 'alive') {
      await sock.sendMessage(from, {
        text: `✅ ${settings.botName} is active and running successfully`
      })
    }

    else if (command === 'runtime') {
      const uptime = process.uptime()
      const hours = Math.floor(uptime / 3600)
      const minutes = Math.floor((uptime % 3600) / 60)

      await sock.sendMessage(from, {
        text: `⏳ Runtime: ${hours}h ${minutes}m`
      })
    }

    else if (command === 'tagall' && isGroup) {
      const metadata = await sock.groupMetadata(from)
      const participants = metadata.participants

      let text = '📢 Group Mention\n\n'
      let mentions = []

      for (let p of participants) {
        mentions.push(p.id)
        text += `@${p.id.split('@')[0]}\n`
      }

      await sock.sendMessage(from, {
        text,
        mentions
      })
    }

    else if (command === 'pp') {
      const profile = await sock.profilePictureUrl(from, 'image').catch(() => null)

      if (!profile) {
        return sock.sendMessage(from, {
          text: 'No profile picture found'
        })
      }

      await sock.sendMessage(from, {
        image: { url: profile },
        caption: 'Profile Picture'
      })
    }

    else if (command === 'ship') {
      if (!isGroup) return

      const metadata = await sock.groupMetadata(from)
      const participants = metadata.participants

      const p1 = participants[Math.floor(Math.random() * participants.length)].id
      const p2 = participants[Math.floor(Math.random() * participants.length)].id

      const love = Math.floor(Math.random() * 100)

      await sock.sendMessage(from, {
        text: `💘 MATCH RESULT 💘\n\n@${p1.split('@')[0]} ❤️ @${p2.split('@')[0]}\n\nLove Percentage: ${love}%`,
        mentions: [p1, p2]
      })
    }

  })
}

startBot()
