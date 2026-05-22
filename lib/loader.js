const chalk = require("chalk").default
const figlet = require("figlet")
const { delay } = require("@whiskeysockets/baileys")

async function startLoader() {

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
║     LOADING SYSTEM         ║
╚════════════════════════════╝
`)
  )

  const loading = [
    "■□□□□□□□□□ 10%",
    "■■□□□□□□□□ 20%",
    "■■■□□□□□□□ 30%",
    "■■■■□□□□□□ 40%",
    "■■■■■□□□□□ 50%",
    "■■■■■■□□□□ 60%",
    "■■■■■■■□□□ 70%",
    "■■■■■■■■□□ 80%",
    "■■■■■■■■■□ 90%",
    "■■■■■■■■■■ 100%"
  ]

  for (let i = 0; i < loading.length; i++) {

    process.stdout.write(
      chalk.yellow(
        `\r🚀 Loading: ${loading[i]}`
      )
    )

    await delay(400)

  }

  console.log(
    chalk.green(`
    
✅ BOT LOADED SUCCESSFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
  )

}

module.exports = {
  startLoader
}