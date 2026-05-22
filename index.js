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
const chalk = require("chalk").default
const figlet = require("figlet")
const readline = require("readline")
const { Boom } = require("@hapi/boom")

const settings = require("./settings")
const { startLoader } = require("./loader")
const {
  loadCommands,
  handleCommand
} = require("./lib/commandHandler")

// ========================================
// CREATE FOLDERS
// ========================================

const folders = [
  "./sessions",
  "./media",
  "./temp",
  "./database",
  "./logs"
]

for (let folder of folders) {

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
    settings.sessionFolder
  )

  const {
    version
  } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({

    version,

    logger:
      pino({
        level: "silent"
      }),

    auth: state,

    printQRInTerminal: false,

    browser:
      Browsers.windows("Chrome"),

    syncFullHistory: true,

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

    const rl =
      readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

    console.log(
      chalk.yellow(`
╔════════════════════════════╗
║   𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝚂𝚈𝚂𝚈𝙴𝙼   ║
╚════════════════════════════╝
`)
    )

    console.log(
      chalk.green(
        "Enter WhatsApp Number"
      )
    )

    console.log(
      chalk.cyan(
        "Example: 2567xxxxxxxx\n"
      )
    )

    rl.question(
      "NUMBER: ",
      async (phone) => {

        try {

          phone =
            phone.replace(/[^0-9]/g, "")

          if (phone.length < 11) {

            console.log(
              chalk.red(
                "Invalid Number"
              )
            )

            rl.close()
            return

          }

          console.log(
            chalk.yellow(
              "\nGenerating Pairing Code...\n"
            )
          )

          await delay(2000)

          const code =
            await sock.requestPairingCode(
              phone
            )

          console.log(
            chalk.green(`
╔════════════════════════════╗
║       𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴   ║
╠════════════════════════════╣
║        ${code}         ║
╚════════════════════════════╝
`)
          )

          console.log(
            chalk.cyan(
              "Open WhatsApp"
            )
          )

          console.log(
            chalk.cyan(
              "Linked Devices"
            )
          )

          console.log(
            chalk.cyan(
              "Link With Phone Number"
            )
          )

          rl.close()

        } catch (err) {

          console.log(
            chalk.red(
              "Failed To Generate Pair Code"
            )
          )

          console.log(err)

          rl.close()

        }

      }
    )

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
║ 𝚂𝙿𝙰𝚁𝚁𝙾𝚆 𝙱𝙾𝚃 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳║
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
          reason !== DisconnectReason.loggedOut
        ) {

          console.log(
            chalk.yellow(
              "Reconnecting..."
            )
          )

          setTimeout(() => {
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
  fs.existsSync(
    settings.botImage
  )
    ? fs.readFileSync(
        settings.botImage
      )
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

        const isGroup =
          from.endsWith("@g.us")

        const body =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage
            ?.text ||
          msg.message?.imageMessage
            ?.caption ||
          msg.message?.videoMessage
            ?.caption ||
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
┃ ⚡𝙼𝙰𝙸𝙽 𝙼𝙴𝙽𝚄
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
            .slice(
              settings.prefix.length
            )
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

(async () => {

  await startLoader()

loadCommands()

startBot()

})()