require("dotenv").config()

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  delay,
  Browsers
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const fs = require("fs")
const chalk = require("chalk")
const figlet = require("figlet")
const { Boom } = require("@hapi/boom")

const settings = require("./settings")
const { startLoader } = require("./loader")

const {
  loadCommands,
  handleCommand
} = require("./lib/commandHandler")

// ========================================
// RECONNECT PROTECTION
// ========================================

let reconnecting = false

// ========================================
// CREATE FOLDERS
// ========================================

const folders = [
  "/sessions",
  "/media",
  "/temp",
  "./database",
  "/logs"
]

for (const folder of folders) {

  if (!fs.existsSync(folder)) {

    fs.mkdirSync(folder)

  }

}

// ========================================
// CONSOLE UI
// ========================================

console.clear()

console.log(
  chalk.cyan(
    figlet.textSync("NOX STAR", {
      horizontalLayout: "default"
    })
  )
)

console.log(
  chalk.green(`
╔════════════════════════════╗
║      𝙱𝙾𝚃 𝚂𝚈𝚂𝚃𝙴𝙼        ║
╚════════════════════════════╝
`)
)

// ========================================
// START BOT
// ========================================

async function startBot() {

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(
    settings.sessionFolder || "./sessions"
  )

  const {
    version
  } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({

    version,

    logger: pino({
      level: "silent"
    }),

    auth: state,

    browser: Browsers.windows("Chrome"),

    syncFullHistory: false,

    markOnlineOnConnect: true,

    generateHighQualityLinkPreview: true,

    connectTimeoutMs: 60000,

    keepAliveIntervalMs: 10000,

    defaultQueryTimeoutMs: 0

  })

  // ========================================
  // PAIRING CODE
  // ========================================

  if (!state.creds.registered) {

    try {

      const phone = process.env.PHONE_NUMBER

      if (!phone) {

        console.log(
          chalk.red(
            "PHONE_NUMBER missing in .env"
          )
        )

        process.exit(1)

      }

      console.log(
        chalk.yellow(
          "\nGenerating Pairing Code...\n"
        )
      )

      await delay(2000)

      const code =
        await sock.requestPairingCode(phone)

      console.log(
        chalk.green(`
╔════════════════════════════╗
║       𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴       ║
╠════════════════════════════╣
║        ${code}        ║
╚════════════════════════════╝
`)
      )

      console.log(
        chalk.cyan(
          "Open WhatsApp > Linked Devices > Link with phone number"
        )
      )

    } catch (err) {

      console.log(
        chalk.red(
          "Failed To Generate Pairing Code"
        )
      )

      console.log(err)

    }

  }

  // ========================================
  // CONNECTION EVENTS
  // ========================================

  sock.ev.on(
    "connection.update",
    async (update) => {

      const {
        connection,
        lastDisconnect
      } = update

      if (connection === "connecting") {

        console.log(
          chalk.yellow(
            "Connecting..."
          )
        )

      }

      if (connection === "open") {

        console.log(
          chalk.green(`
╔══════_____════════════_____══════════╗
║ 𝚂𝙿𝙰𝚁𝚁𝙾𝚆 𝙱𝙾𝚃 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳 ║
╚══════____════════════════______══════╝
`)
        )

      }

      if (connection === "close") {

        const reason =
          new Boom(
            lastDisconnect?.error
          )?.output?.statusCode

        console.log(
          chalk.red(
            `Disconnected: ${reason}`
          )
        )

        if (
          reason !== DisconnectReason.loggedOut &&
          !reconnecting
        ) {

          reconnecting = true

          console.log(
            chalk.yellow(
              "Reconnecting..."
            )
          )

          setTimeout(() => {

            reconnecting = false

            startBot()

          }, 5000)

        }

      }

    }
  )

  // ========================================
  // SAVE CREDS
  // ========================================

  sock.ev.on(
    "creds.update",
    saveCreds
  )

  // ========================================
  // BOT IMAGE
  // ========================================

  const menuImage =
    settings.botImage &&
    fs.existsSync(settings.botImage)
      ? fs.readFileSync(settings.botImage)
      : null

  // ========================================
  // MESSAGE EVENT
  // ========================================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      try {

        const msg = messages[0]

        if (!msg.message) return

        const from =
          msg.key?.remoteJid

        if (!from) return

        const body =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.videoMessage?.caption ||
          ""

        const pushname =
          msg.pushName || "User"

        // ========================================
        // REPLY MENU SYSTEM
        // ========================================

        if (body === "1") {

          return sock.sendMessage(from, {
            text: `
╭━━━━━━━━━━━━━━━━━━╮
┃ ⚡ MAIN MENU
╰━━━━━━━━━━━━━━━━━━╯

┃ ➤ .ping
┃ ➤ .alive
┃ ➤ .runtime
┃ ➤ .menu

╭━━━━━━━━━━━━━━━━━━╮
┃ ${settings.channelLink}
┃ 👑 ${settings.footerName}
╰━━━━━━━━━━━━━━━━━━╯
`
          })

        }

        if (body === "2") {

          return sock.sendMessage(from, {
            text: `
╭━━━━━━━━━━━━━━━━━━╮
┃ 👥 GROUP MENU
╰━━━━━━━━━━━━━━━━━━╯

┃ ➤ .tagall
┃ ➤ .kick
┃ ➤ .promote
┃ ➤ .demote
┃ ➤ .hidetag

╭━━━━━━━━━━━━━━━━━━╮
┃ ${settings.channelLink}
┃ 👑 ${settings.footerName}
╰━━━━━━━━━━━━━━━━━━╯
`
          })

        }

        if (body === "3") {

          return sock.sendMessage(from, {
            text: `
╭━━━━━━━━━━━━━━━━━━╮
┃ 🎮 FUN MENU
╰━━━━━━━━━━━━━━━━━━╯

┃ ➤ .ship
┃ ➤ .joke
┃ ➤ .truth
┃ ➤ .roast
┃ ➤ .aura

╭━━━━━━━━━━━━━━━━━━╮
┃ ${settings.channelLink}
┃ 👑 ${settings.footerName}
╰━━━━━━━━━━━━━━━━━━╯
`
          })

        }

        if (body === "4") {

          return sock.sendMessage(from, {
            text: `
╭━━━━━━━━━━━━━━━━━━╮
┃ 🤖 AI MENU
╰━━━━━━━━━━━━━━━━━━╯

┃ ➤ .ai
┃ ➤ .chatgpt
┃ ➤ .image
┃ ➤ .code

╭━━━━━━━━━━━━━━━━━━╮
┃ ${settings.channelLink}
┃ 👑 ${settings.footerName}
╰━━━━━━━━━━━━━━━━━━╯
`
          })

        }

        if (body === "5") {

          return sock.sendMessage(from, {
            text: `
╭━━━━━━━━━━━━━━━━━━╮
┃ 🛠 TOOLS MENU
╰━━━━━━━━━━━━━━━━━━╯

┃ ➤ .pp
┃ ➤ .font
┃ ➤ .fetch
┃ ➤ .qr

╭━━━━━━━━━━━━━━━━━━╮
┃ ${settings.channelLink}
┃ 👑 ${settings.footerName}
╰━━━━━━━━━━━━━━━━━━╯
`
          })

        }

        if (body === "6") {

          return sock.sendMessage(from, {
            text: `
╭━━━━━━━━━━━━━━━━━━╮
┃ 📥 DOWNLOAD MENU
╰━━━━━━━━━━━━━━━━━━╯

┃ ➤ .play
┃ ➤ .ytmp3
┃ ➤ .ytmp4
┃ ➤ .tiktok

╭━━━━━━━━━━━━━━━━━━╮
┃ ${settings.channelLink}
┃ 👑 ${settings.footerName}
╰━━━━━━━━━━━━━━━━━━╯
`
          })

        }

        if (body === "7") {

          return sock.sendMessage(from, {
            text: `
╭━━━━━━━━━━━━━━━━━━╮
┃ 👑 OWNER MENU
╰━━━━━━━━━━━━━━━━━━╯

┃ ➤ .restart
┃ ➤ .shutdown
┃ ➤ .public
┃ ➤ .private

╭━━━━━━━━━━━━━━━━━━╮
┃ ${settings.channelLink}
┃ 👑 ${settings.footerName}
╰━━━━━━━━━━━━━━━━━━╯
`
          })

        }

        // ========================================
        // PREFIX CHECK
        // ========================================

        if (
          !body.startsWith(
            settings.prefix
          )
        ) return

        const args =
          body
            .slice(settings.prefix.length)
            .trim()
            .split(/ +/)

        const command =
          args.shift()?.toLowerCase()

        if (!command) return

        await handleCommand(
          sock,
          msg,
          command,
          args
        )

      } catch (err) {

        console.log(err)

      }

    }
  )

}

// ========================================
// START SYSTEM
// ========================================

;(async () => {

  await startLoader()

  loadCommands()

  startBot()

})()