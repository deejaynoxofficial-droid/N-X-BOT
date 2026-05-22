const fs = require("fs")
const path = require("path")

const commands = new Map()

function loadCommands() {

  const folders =
    fs.readdirSync("./commands")

  for (const folder of folders) {

    const files =
      fs.readdirSync(
        `./commands/${folder}`
      )

    for (const file of files) {

      if (!file.endsWith(".js"))
        continue

      const command =
        require(
          path.join(
            process.cwd(),
            "commands",
            folder,
            file
          )
        )

      commands.set(
        command.name,
        command
      )

      console.log(
        `Loaded Command: ${command.name}`
      )

    }

  }

}

async function handleCommand(
  sock,
  msg,
  commandName,
  args
) {

  const command =
    commands.get(commandName)

  if (!command) return

  try {

    await command.execute(
      sock,
      msg,
      args
    )

  } catch (err) {

    console.log(
      `Command Error: ${commandName}`
    )

    console.log(err)

  }

}

module.exports = {
  loadCommands,
  handleCommand
}