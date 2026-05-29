require("dotenv").config()

// ========================================
// IMPORTS
// ========================================

const express = require("express")
const fs = require("fs")
const path = require("path")
const pino = require("pino")
const axios = require("axios")
const chalk = require("chalk").default || require("chalk")

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  delay,
  Browsers
} = require("@whiskeysockets/baileys")

// ========================================
// SETTINGS
// ========================================

const settings = {
  botName: "NOX-SPARROW",
  prefix: ".",
  ownerNumber: "256745720308",
  sessionFolder: "./sessions/main",
  tempFolder: "./temp",
  logsFolder: "./logs",
  autoRead: true
}

// ========================================
// EXPRESS
// ========================================

const app = express()

app.use(express.json())

// ========================================
// CREATE FOLDERS
// ========================================

function createFolders() {

  const folders = [
    "./sessions",
    "./sessions/main",
    "./temp",
    "./logs",
    "./database"
  ]

  for (const folder of folders) {

    if (!fs.existsSync(folder)) {

      fs.mkdirSync(folder, {
        recursive: true
      })
    }
  }
}

createFolders()

// ========================================
// GLOBALS
// ========================================

let sock = null
let reconnecting = false

// ========================================
// SAFE PAIR ROUTE
// ========================================

app.get("/pair", async (req, res) => {

  try {

    let number = req.query.number

    if (!number) {

      return res.json({
        status: false,
        message: "ENTER NUMBER"
      })
    }

    // ========================================
    // CLEAN NUMBER
    // ========================================

    number = number.replace(/[^0-9]/g, "")

    if (number.length < 11) {

      return res.json({
        status: false,
        message: "INVALID NUMBER"
      })
    }

    console.log(
      chalk.yellow(`PAIR REQUEST: ${number}`)
    )

    // ========================================
    // SESSION
    // ========================================

    const sessionPath =
      `./sessions/${number}`

    if (!fs.existsSync(sessionPath)) {

      fs.mkdirSync(sessionPath, {
        recursive: true
      })
    }

    // ========================================
    // AUTH
    // ========================================

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      sessionPath
    )

    // ========================================
    // VERSION
    // ========================================

    const {
      version
    } = await fetchLatestBaileysVersion()

    // ========================================
    // SOCKET
    // ========================================

    const pairSock = makeWASocket({

      version,

      logger: pino({
        level: "silent"
      }),

      auth: state,

      browser:
        Browsers.windows("Chrome"),

      printQRInTerminal: false,

      syncFullHistory: false,

      markOnlineOnConnect: false,

      connectTimeoutMs: 60000,

      defaultQueryTimeoutMs: 0,

      keepAliveIntervalMs: 10000
    })

    pairSock.ev.on(
      "creds.update",
      saveCreds
    )

    // ========================================
    // WAIT CONNECTION
    // ========================================

    await delay(4000)

    // ========================================
    // GENERATE CODE
    // ========================================

    const code =
      await pairSock.requestPairingCode(
        number
      )

    console.log(
      chalk.green(`PAIR CODE: ${code}`)
    )

    return res.json({
      status: true,
      code
    })

  } catch (err) {

    console.log(
      chalk.red("PAIR ERROR:")
    )

    console.log(err)

    return res.json({
      status: false,
      message: "PAIRING FAILED"
    })
  }
})

// ========================================
// START BOT
// ========================================

async function startBot() {

  try {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      settings.sessionFolder
    )

    const {
      version
    } = await fetchLatestBaileysVersion()

    sock = makeWASocket({

      version,

      logger:
        pino({
          level: "silent"
        }),

      auth: state,

      browser:
        Browsers.windows("Chrome"),

      printQRInTerminal: false,

      syncFullHistory: true,

      markOnlineOnConnect: true,

      connectTimeoutMs: 60000,

      keepAliveIntervalMs: 10000,

      defaultQueryTimeoutMs: 0
    })

    // ========================================
    // SAVE CREDS
    // ========================================

    sock.ev.on(
      "creds.update",
      saveCreds
    )

    // ========================================
    // CONNECTION UPDATE
    // ========================================

    sock.ev.on(
      "connection.update",
      async (update) => {

        try {

          const {
            connection,
            lastDisconnect
          } = update

          if (connection === "connecting") {

            console.log(
              chalk.yellow(
                "CONNECTING..."
              )
            )
          }

          if (connection === "open") {

            reconnecting = false

            console.log(
              chalk.green(
                "BOT CONNECTED"
              )
            )

            console.log(
              chalk.cyan(
                `USER: ${sock.user.id}`
              )
            )
          }

          if (connection === "close") {

            const reason =
              lastDisconnect?.error
                ?.output?.statusCode

            console.log(
              chalk.red(
                `DISCONNECTED: ${reason}`
              )
            )

            if (
              reason ===
              DisconnectReason.loggedOut
            ) {

              console.log(
                chalk.red(
                  "SESSION LOGGED OUT"
                )
              )

              return
            }

            if (reconnecting) return

            reconnecting = true

            console.log(
              chalk.yellow(
                "RECONNECTING..."
              )
            )

            setTimeout(() => {
              startBot()
            }, 5000)
          }

        } catch (err) {

          console.log(
            "CONNECTION ERROR:",
            err
          )
        }
      }
    )

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
            msg.key.remoteJid

          const body =
            msg.message?.conversation ||

            msg.message
              ?.extendedTextMessage
              ?.text ||

            msg.message
              ?.imageMessage
              ?.caption ||

            msg.message
              ?.videoMessage
              ?.caption ||

            ""

          console.log(
            chalk.green(
              `MESSAGE: ${body}`
            )
          )

          // ========================================
          // AUTO READ
          // ========================================

          if (settings.autoRead) {

            await sock.readMessages([
              msg.key
            ])
          }

          // ========================================
          // PREFIX
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
            args.shift().toLowerCase()

          // ========================================
          // PING
          // ========================================

          if (command === "ping") {

            return await sock.sendMessage(
              from,
              {
                text: "PONG 🏓"
              }
            )
          }

          // ========================================
          // MENU
          // ========================================

          if (command === "menu") {

            const menuText = `
╭━━━━━━━━━━━━━━━━━━━━╮
┃ 🤖 ${settings.botName}
╰━━━━━━━━━━━━━━━━━━━━╯

┃ ⚡ Prefix: ${settings.prefix}
┃ 🚀 Status: Online

╭━━━━━━━━━━━━━━━━━━╮
┃ 1️⃣ Main Menu
┃ 2️⃣ Group Menu
┃ 3️⃣ Fun Menu
┃ 4️⃣ AI Menu
┃ 5️⃣ Tools Menu
┃ 6️⃣ Download Menu
┃ 7️⃣ Owner Menu
╰━━━━━━━━━━━━━━━━━━╯
`

            return await sock.sendMessage(
              from,
              {
                text: menuText
              }
            )
          }

        } catch (err) {

          console.log(
            "MESSAGE ERROR:",
            err
          )
        }
      }
    )

  } catch (err) {

    console.log(
      "START BOT ERROR:",
      err
    )

    setTimeout(() => {

      startBot()

    }, 5000)
  }
}

// ========================================
// KEEP ALIVE
// ========================================

if (
  process.env.RENDER_EXTERNAL_URL
) {

  setInterval(async () => {

    try {

      await axios.get(
        process.env.RENDER_EXTERNAL_URL
      )

    } catch {}

  }, 240000)
}

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {

  res.send(`
<h2>NOX-SPARROW BOT RUNNING</h2>
<p>Pair Route:</p>
<p>/pair?number=2567xxxxxxxx</p>
`)
})

// ========================================
// START SERVER
// ========================================

const PORT =
  process.env.PORT || 3000

app.listen(PORT, () => {

  console.log(
    chalk.green(
      `SERVER RUNNING ON ${PORT}`
    )
  )

  startBot()
})
