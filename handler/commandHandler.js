const fs = require('fs')
const path = require('path')

const settings = require('../settings')
const ui = require('../utils/ui')

let getUser = () => ({})
let getGroup = () => ({})

try {
    const database = require('../database/database')
    getUser = database.getUser || getUser
    getGroup = database.getGroup || getGroup
} catch (err) {
    console.log('⚠️ DATABASE NOT FOUND')
}

const commands = new Map()
const commandsPath = path.join(__dirname, '../commands')

function loadCommands() {
    commands.clear()

    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true })
    }

    const files = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.js'))
        .sort()

    for (const file of files) {
        try {
            const filePath = path.join(commandsPath, file)
            delete require.cache[require.resolve(filePath)]
            const command = require(filePath)

            if (!command || typeof command !== 'object') continue
            if (!command.name || typeof command.execute !== 'function') continue

            const name = String(command.name).toLowerCase()
            commands.set(name, command)

            if (Array.isArray(command.aliases)) {
                for (const alias of command.aliases) {
                    if (typeof alias === 'string' && alias.trim()) {
                        commands.set(alias.toLowerCase(), command)
                    }
                }
            }

            console.log(`✅ LOADED: ${name}`)
        } catch (err) {
            console.log(`❌ FAILED: ${file}`)
            console.log(err.message || err)
        }
    }

    console.log(`📦 TOTAL COMMANDS: ${commands.size}`)
}

loadCommands()

function unwrapMessage(message = {}) {
    let current = message
    for (let i = 0; i < 5; i++) {
        const next = current?.ephemeralMessage?.message ||
            current?.viewOnceMessage?.message ||
            current?.viewOnceMessageV2?.message ||
            current?.documentWithCaptionMessage?.message
        if (!next) break
        current = next
    }
    return current || {}
}

function getBody(msg) {
    try {
        const message = unwrapMessage(msg?.message || {})
        return String(
            message.conversation ||
            message.extendedTextMessage?.text ||
            message.imageMessage?.caption ||
            message.videoMessage?.caption ||
            message.documentMessage?.caption ||
            message.buttonsResponseMessage?.selectedButtonId ||
            message.listResponseMessage?.singleSelectReply?.selectedRowId ||
            message.templateButtonReplyMessage?.selectedId ||
            ''
        ).trim()
    } catch (_) {
        return ''
    }
}

function normalizeSender(jid) {
    if (!jid) return ''
    const value = String(jid)
    if (value.endsWith('@s.whatsapp.net')) return value.split(':')[0] + '@s.whatsapp.net'
    if (value.endsWith('@lid')) return value
    if (value.includes('@')) return value
    return value.split(':')[0] + '@s.whatsapp.net'
}

function isOwner(sender) {
    const ownerNumbers = Array.isArray(settings.ownerNumbers) && settings.ownerNumbers.length
        ? settings.ownerNumbers
        : [settings.ownerNumber]
    const cleanSender = normalizeSender(sender)
    return ownerNumbers.some(number => normalizeSender(String(number).replace(/\D/g, '')) === cleanSender)
}

async function sendSystemMessage(sock, from, text, msg) {
    try {
        const branded = ui.createBrandedSocket(sock, 'system')
        ui.resetCommandBranding(sock)
        return await branded.sendMessage(from, { text }, { quoted: msg })
    } catch (_) {}
}

async function executeCommand(commandName, sock, msg, args = []) {
    const normalizedCommandName = String(commandName || '').toLowerCase()
    const command = commands.get(normalizedCommandName)
    if (!command) return false

    const from = msg?.key?.remoteJid
    if (!from) return false

    const isGroup = from.endsWith('@g.us')
    const rawSender = isGroup ? (msg.key?.participant || msg.key?.participantAlt || from) : from
    const sender = normalizeSender(rawSender)

    let userData = {}
    let groupData = {}
    try {
        userData = getUser(sender) || {}
        if (isGroup) groupData = getGroup(from) || {}
    } catch (_) {}

    if (command.owner === true && !isOwner(sender)) {
        await sendSystemMessage(sock, from, '❌ Owner-only command.\n👑 This command is restricted to the bot owner.', msg)
        return true
    }

    if (command.group === true && !isGroup) {
        await sendSystemMessage(sock, from, '❌ Group-only command.\n👥 Use this command inside a WhatsApp group.', msg)
        return true
    }

    // Menu is a stateful interaction command. Execute it directly so its
    // message/session bookkeeping is never affected by response decoration.
    const executionSock = normalizedCommandName === 'menu' || normalizedCommandName === 'help' || normalizedCommandName === 'allmenu'
        ? sock
        : ui.createBrandedSocket(sock, String(command.name).toLowerCase())
    ui.resetCommandBranding(sock)

    try {
        await command.execute(executionSock, msg, Array.isArray(args) ? args : [], {
            from,
            sender,
            isGroup,
            userData,
            groupData,
            prefix: settings.prefix || '.',
            commandName: command.name,
            ui
        })
        console.log(`✅ SUCCESS: ${command.name}`)
    } catch (err) {
        console.log(`❌ EXECUTE ERROR: ${command.name}`)
        console.log(err)
        await sendSystemMessage(sock, from, `❌ ${settings.errorEmoji || '❌'} Command failed.\n🛠️ ${err.message || 'Unknown error'}`, msg)
    }

    return true
}

async function handleCommand(sock, msg) {
    try {
        if (!sock || !msg?.message) return

        const from = msg.key?.remoteJid
        if (!from || from === 'status@broadcast') return

        const body = getBody(msg)
        if (!body) return

        const prefix = settings.prefix || '.'
        if (!body.startsWith(prefix)) return

        const parts = body.slice(prefix.length).trim().split(/\s+/)
        const commandName = parts.shift()?.toLowerCase()
        if (!commandName) return

        console.log(`📥 ${commandName}`)
        await executeCommand(commandName, sock, msg, parts)
    } catch (err) {
        console.log('❌ HANDLE COMMAND ERROR')
        console.log(err)
    }
}

module.exports = {
    handleCommand,
    executeCommand,
    reloadCommands: loadCommands,
    commands,
    getBody,
    normalizeSender,
    isOwner
}
