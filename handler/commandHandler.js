const fs = require('fs')
const path = require('path')
const settings = require('../settings')
const { getUser, getGroup } = require('../database/database')

//========================================
// COMMAND STORAGE
//========================================

const commands = new Map()

//========================================
// PATH
//========================================

const commandsPath = path.join(__dirname, '../commands')

//========================================
// SAFE FOLDER CHECK
//========================================

if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true })
}

//========================================
// LOAD COMMANDS SAFELY
//========================================

function loadCommands() {

    commands.clear()

    let files = []

    try {
        files = fs.readdirSync(commandsPath)
    } catch (err) {
        console.log('COMMAND FOLDER ERROR:', err)
        return
    }

    for (const file of files) {

        if (!file.endsWith('.js')) continue

        try {

            const cmd = require(path.join(commandsPath, file))

            if (!cmd || typeof cmd !== 'object') {
                console.log(`❌ Invalid command: ${file}`)
                continue
            }

            if (typeof cmd.name !== 'string') {
                console.log(`❌ Missing name: ${file}`)
                continue
            }

            if (typeof cmd.execute !== 'function') {
                console.log(`❌ Missing execute: ${file}`)
                continue
            }

            const name = cmd.name.toLowerCase()

            commands.set(name, cmd)

            // aliases
            if (Array.isArray(cmd.aliases)) {

                for (const alias of cmd.aliases) {

                    if (typeof alias === 'string') {
                        commands.set(alias.toLowerCase(), cmd)
                    }
                }
            }

            console.log(`✅ Loaded: ${cmd.name}`)

        } catch (err) {
            console.log(`❌ Failed loading ${file}`)
            console.log(err)
        }
    }

    console.log(`📦 TOTAL COMMANDS: ${commands.size}`)
}

// initial load
loadCommands()

//========================================
// HANDLE COMMANDS
//========================================

async function handleCommand(sock, msg) {

    try {

        if (!sock || !msg?.message) return

        const from = msg.key?.remoteJid
        if (!from) return

        const isGroup = from.endsWith('@g.us')

        const sender = isGroup
            ? (msg.key?.participant || '')
            : from

        const normalizedSender = sender.includes(':')
            ? sender.split(':')[0] + '@s.whatsapp.net'
            : sender

        //========================================
        // MESSAGE TEXT
        //========================================

        const message = msg.message

        const body =
            message?.conversation ||
            message?.extendedTextMessage?.text ||
            message?.imageMessage?.caption ||
            message?.videoMessage?.caption ||
            message?.buttonsResponseMessage?.selectedButtonId ||
            message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
            message?.templateButtonReplyMessage?.selectedId ||
            ''

        if (!body || typeof body !== 'string') return

        const prefix = settings.prefix || '.'

        if (!body.startsWith(prefix)) return

        const args = body.slice(prefix.length).trim().split(/\s+/)

        const commandName = args.shift()?.toLowerCase()

        if (!commandName) return

        const command = commands.get(commandName)

        if (!command) {
            console.log(`❌ Unknown command: ${commandName}`)
            return
        }

        //========================================
        // DATABASE SAFE
        //========================================

        const userData = getUser(normalizedSender)
        const groupData = isGroup ? getGroup(from) : null

        //========================================
        // BLOCKED USER
        //========================================

        if (userData?.banned) {
            return sock.sendMessage(from, {
                text: '❌ You are banned.'
            })
        }

        //========================================
        // MAINTENANCE MODE
        //========================================

        if (
            settings.maintenance &&
            normalizedSender !== `${settings.ownerNumber}@s.whatsapp.net`
        ) {
            return sock.sendMessage(from, {
                text: '🚧 Bot under maintenance.'
            })
        }

        //========================================
        // OWNER ONLY
        //========================================

        if (
            command.owner &&
            normalizedSender !== `${settings.ownerNumber}@s.whatsapp.net`
        ) {
            return sock.sendMessage(from, {
                text: '❌ Owner only command.'
            })
        }

        //========================================
        // GROUP ONLY
        //========================================

        if (command.group && !isGroup) {
            return sock.sendMessage(from, {
                text: '❌ Group only command.'
            })
        }

        //========================================
        // PRIVATE ONLY
        //========================================

        if (command.private && isGroup) {
            return sock.sendMessage(from, {
                text: '❌ Private only command.'
            })
        }

        //========================================
        // EXECUTE SAFELY
        //========================================

        console.log(`▶ EXECUTING: ${commandName}`)

        await Promise.resolve(
            command.execute(sock, msg, args, {
                userData,
                groupData,
                isGroup,
                sender: normalizedSender
            })
        )

    } catch (err) {
        console.log('❌ COMMAND HANDLER ERROR:')
        console.log(err)
    }
}

//========================================
// EXPORTS
//========================================

module.exports = {
    handleCommand,
    reloadCommands: loadCommands,
    commands
}
