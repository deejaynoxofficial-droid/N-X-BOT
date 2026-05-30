const chalkImport =
    require('chalk')

const chalk =
    chalkImport.default ||
    chalkImport

console.log(
    chalk.yellow(
        '╭━━〔 ⚡ LOADING COMMANDS ⚡ 〕━━⬣'
    )
)

console.log(
    chalk.green(
        '┃ Initializing bot commands...'
    )
)

console.log(
    chalk.cyan(
        '╰━━━━━━━━━━━━━━━━━━━━━━⬣'
    )
)
