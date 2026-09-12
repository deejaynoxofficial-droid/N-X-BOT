const fs = require('fs')
const path = require('path')
const settings = require('../settings')
function getHandler() { return require('../handler/commandHandler') }
const ui = require('../utils/ui')

// One consistent numbered-navigation system for the whole bot.
global.menuReplies = global.menuReplies || {}

const CATEGORIES = {
    main: {
        title: 'MAIN MENU',
        emoji: '🏠',
        commands: ['ping', 'alive', 'profile', 'help', 'repo', 'gitclone', 'npm', 'calculate']
    },
    group: {
        title: 'GROUP MENU',
        emoji: '👥',
        commands: ['group', 'add', 'kick', 'promote', 'demote', 'tagall', 'mute', 'antilink', 'antibadword', 'adminsonly', 'groupmode', 'goodbye']
    },
    fun: {
        title: 'FUN MENU',
        emoji: '🎮',
        commands: ['joke', 'fact', 'quote', 'anime', 'animepic', 'nsfw']
    },
    ai: {
        title: 'AI MENU',
        emoji: '🤖',
        commands: ['ai', 'chatbot', 'image', 'translate']
    },
    tools: {
        title: 'TOOLS MENU',
        emoji: '🛠️',
        commands: ['shorturl', 'tourl', 'toimg', 'apk', 'news', 'weather', 'getpp', 'autoviewonce', 'setprefix']
    },
    download: {
        title: 'DOWNLOAD MENU',
        emoji: '📥',
        commands: ['play', 'song', 'ytmp3', 'ytmp4', 'video', 'tiktok', 'instagram', 'facebook', 'twitter', 'spotify', 'pinterest', 'mediafire']
    },
    owner: {
        title: 'OWNER MENU',
        emoji: '👑',
        commands: ['owner', 'pair', 'broadcast', 'backup', 'ban', 'unban', 'delete', 'setbotdp', 'setname', 'setbio']
    }
}

const CATEGORY_ORDER = Object.keys(CATEGORIES)
const COMMAND_EMOJIS = {
    ping: '🏓', alive: '💚', profile: '👤', help: '❓', repo: '📦', gitclone: '🐙', npm: '📚', calculate: '🧮',
    group: '⚙️', add: '➕', kick: '👢', promote: '⬆️', demote: '⬇️', tagall: '📢', mute: '🔇', antilink: '🔗', antibadword: '🛡️', adminsonly: '👮', groupmode: '🎛️', goodbye: '👋',
    joke: '😂', fact: '🧠', quote: '💬', anime: '🌸', animepic: '🖼️', nsfw: '🔞',
    ai: '🤖', chatbot: '💭', image: '🎨', translate: '🌐',
    shorturl: '🔗', tourl: '☁️', toimg: '🖼️', apk: '📱', news: '📰', getpp: '🧑‍🎨', autoviewonce: '👁️', setprefix: '⚙️',
    play: '🎵', song: '🎶', ytmp3: '🎧', ytmp4: '🎬', video: '📹', tiktok: '🎵', instagram: '📸', facebook: '📘', twitter: '🐦', spotify: '🟢', pinterest: '📌', mediafire: '📁',
    owner: '👑', pair: '📲', broadcast: '📡', backup: '💾', ban: '🚫', unban: '♻️', delete: '🗑️', setbotdp: '🖼️', setname: '✏️', setbio: '📝'
}

const DESCRIPTIONS = {
    ping: 'Check bot speed', alive: 'Check bot status', profile: 'View your profile', help: 'Command help', repo: 'Bot repository', gitclone: 'GitHub tools', npm: 'NPM package lookup', calculate: 'Calculate expressions',
    group: 'Group management', add: 'Add a member', kick: 'Remove a member', promote: 'Promote to admin', demote: 'Remove admin', tagall: 'Mention everyone', mute: 'Mute group chat', antilink: 'Protect against links', antibadword: 'Block bad words', adminsonly: 'Admin-only mode', groupmode: 'Group mode settings', goodbye: 'Goodbye settings',
    joke: 'Random jokes', fact: 'Interesting facts', quote: 'Inspirational quotes', anime: 'Anime search', animepic: 'Anime pictures', nsfw: 'NSFW content',
    ai: 'Ask NOX AI', chatbot: 'AI chatbot', image: 'Generate/search images', translate: 'Translate text',
    shorturl: 'Shorten a URL', tourl: 'Upload media to URL', toimg: 'Convert media to image', apk: 'APK information', news: 'Latest news search', getpp: 'Get profile picture', autoviewonce: 'View-once tools', setprefix: 'Change bot prefix',
    play: 'Search and play music', song: 'Download a song', ytmp3: 'YouTube to MP3', ytmp4: 'YouTube to MP4', video: 'Search/download video', tiktok: 'TikTok downloader', instagram: 'Instagram downloader', facebook: 'Facebook downloader', twitter: 'Twitter downloader', spotify: 'Spotify search', pinterest: 'Pinterest search', mediafire: 'MediaFire downloader',
    owner: 'Owner information', pair: 'Generate WhatsApp pairing code', broadcast: 'Broadcast messages', backup: 'Backup bot data', ban: 'Ban a user', unban: 'Unban a user', delete: 'Delete a message', setbotdp: 'Change bot picture', setname: 'Change bot name', setbio: 'Change bot bio'
}

function getBody(msg) {
    try {
        let m = msg?.message || {}
        for (let i = 0; i < 5; i++) {
            const next = m?.ephemeralMessage?.message || m?.viewOnceMessage?.message || m?.viewOnceMessageV2?.message
            if (!next) break
            m = next
        }
        return String(
            m.conversation ||
            m.extendedTextMessage?.text ||
            m.imageMessage?.caption ||
            m.videoMessage?.caption ||
            m.documentMessage?.caption ||
            m.buttonsResponseMessage?.selectedButtonId ||
            m.listResponseMessage?.singleSelectReply?.selectedRowId ||
            m.templateButtonReplyMessage?.selectedId || ''
        ).trim()
    } catch (_) { return '' }
}

function senderKey(msg) {
    const from = msg?.key?.remoteJid || ''
    const participant = msg?.key?.participant || msg?.key?.participantAlt || ''
    return {
        from,
        participant,
        keys: [from, participant, participant ? String(participant).split(':')[0] : ''].filter(Boolean)
    }
}

function rememberMenu(msg, data) {
    const { from, participant } = senderKey(msg)
    const key = participant || from
    if (key) global.menuReplies[key] = { ...data, time: Date.now() }
}

function getMenuState(msg) {
    const { from, participant } = senderKey(msg)
    const keys = participant ? [participant, from] : [from]
    for (const key of keys.filter(Boolean)) {
        const value = global.menuReplies[key]
        if (value && Date.now() - value.time <= 300000) return value
    }
    return null
}

function clearMenu(msg) {
    const { from, participant } = senderKey(msg)
    for (const key of [participant, from].filter(Boolean)) delete global.menuReplies[key]
}

function commandExists(name) {
    const cmd = getHandler().commands.get(name)
    return !!(cmd && typeof cmd.execute === 'function')
}

function getCategoryCommands(category) {
    return (CATEGORIES[category]?.commands || []).filter(commandExists)
}

function footerLine() {
    return `📢 Channel: ${settings.channel}\n⚡ Powered by: ${settings.ownerName || 'NOX STAR.B'}`
}

function buildMainMenu(msg) {
    const name = msg?.pushName || 'User'
    const prefix = settings.prefix || '.'
    const rows = [
        `👤 User: ${name}`,
        `⚡ Prefix: ${prefix}`,
        `📦 Commands: ${new Set([...getHandler().commands.values()]).size}`,
        '',
        '╭━━〔 📂 CATEGORIES 〕━━╮'
    ]

    CATEGORY_ORDER.forEach((key, index) => {
        const cat = CATEGORIES[key]
        const count = getCategoryCommands(key).length
        rows.push(`┃ ${index + 1}️⃣ ${cat.emoji} ${cat.title} • ${count} cmds`)
    })
    rows.push('╰━━━━━━━━━━━━━━━━━━━━╯')
    rows.push('', `💬 Reply with a number (1-${CATEGORY_ORDER.length})`, `⌨️ Or use: ${prefix}command`)
    rows.push('', footerLine())
    return `╭━━━〔 🦅 ${settings.botName || 'NOX SPARROW BOT'} 〕━━━╮\n┃\n${rows.map(r => r ? `┃ ${r}` : '┃').join('\n')}\n╰━━━━━━━━━━━━━━━━━━━━━━╯`
}

function buildCategoryMenu(category) {
    const cat = CATEGORIES[category]
    const list = getCategoryCommands(category)
    const out = [`╭━━〔 ${cat.emoji} ${cat.title} 〕━━╮`, '┃']

    list.forEach((name, index) => {
        const cmd = getHandler().commands.get(name)
        const emoji = COMMAND_EMOJIS[name] || '🔹'
        const desc = DESCRIPTIONS[name] || cmd.description || 'Bot command'
        out.push(`┃ ${index + 1}️⃣ ${emoji} ${name} — ${desc}`)
    })

    out.push('┃', '┣━━━━━━━━━━━━━━━━━━━━━━┫', '┃ 0️⃣ 🔙 Back to main menu', '┃', `┃ 💬 Reply with 1-${list.length} to run a command`, `┃ ✨ Example: 1`, '┃', `┃ ${footerLine().replace(/\n/g, '\n┃ ')}`, '╰━━━━━━━━━━━━━━━━━━━━━━╯')
    return out.join('\n')
}

async function sendMenu(sock, msg, text, state) {
    const from = msg?.key?.remoteJid
    if (!from) return false

    const branded = ui.createBrandedSocket(sock, 'menu')
    ui.resetCommandBranding(sock)
    let sent
    try {
        if (ui.logoBuffer) {
            sent = await sock.sendMessage(from, {
                image: ui.logoBuffer,
                caption: text
            }, { quoted: msg })
        } else {
            sent = await branded.sendMessage(from, { text }, { quoted: msg })
        }
    } catch (_) {
        sent = await branded.sendMessage(from, { text }, { quoted: msg })
    }

    rememberMenu(msg, {
        ...state,
        menuMessageId: sent?.key?.id || null
    })
    return true
}

async function execute(sock, msg) {
    const text = buildMainMenu(msg)
    return sendMenu(sock, msg, text, { level: 'main', category: null })
}

async function replyHandler(sock, msg) {
    const body = getBody(msg)
    if (!body) return false

    const state = getMenuState(msg)
    if (!state) return false

    const replyTo = msg?.message?.extendedTextMessage?.contextInfo?.stanzaId ||
        msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.key?.id || null

    // If the user replies to an unrelated message, do not hijack numeric commands.
    if (replyTo && state.menuMessageId && replyTo !== state.menuMessageId) return false

    const parts = body.split(/\s+/)
    const choice = parts.shift()
    const rest = parts

    if (!/^\d+$/.test(choice)) return false
    const number = Number(choice)

    if (state.level === 'main') {
        if (number < 1 || number > CATEGORY_ORDER.length) return false
        const category = CATEGORY_ORDER[number - 1]
        const list = getCategoryCommands(category)
        if (!list.length) return false
        await sendMenu(sock, msg, buildCategoryMenu(category), { level: 'category', category })
        return true
    }

    if (state.level === 'category') {
        if (number === 0) {
            clearMenu(msg)
            await sendMenu(sock, msg, buildMainMenu(msg), { level: 'main', category: null })
            return true
        }

        const list = getCategoryCommands(state.category)
        if (number < 1 || number > list.length) return false

        const commandName = list[number - 1]
        clearMenu(msg)
        await getHandler().executeCommand(commandName, sock, msg, rest)
        return true
    }

    return false
}

setInterval(() => {
    const now = Date.now()
    for (const key of Object.keys(global.menuReplies)) {
        if (!global.menuReplies[key] || now - global.menuReplies[key].time > 300000) {
            delete global.menuReplies[key]
        }
    }
}, 60000).unref()

module.exports = {
    name: 'menu',
    aliases: ['help', 'allmenu'],
    category: 'main',
    description: 'Beautiful numbered menu system',
    execute,
    replyHandler,
    categories: CATEGORIES
}
