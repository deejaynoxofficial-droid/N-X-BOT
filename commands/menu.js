const fs = require('fs')
const path = require('path')
const settings = require('../settings')
const ui = require('../utils/ui')

// Numbered menu state is kept per chat/user so group users do not overwrite
// each other's menus.
global.menuReplies = global.menuReplies || Object.create(null)

const CATEGORIES = {
    main: { title: 'MAIN MENU', emoji: '🏠', commands: ['ping', 'alive', 'profile', 'help', 'repo', 'gitclone', 'npm', 'calculate'] },
    group: { title: 'GROUP MENU', emoji: '👥', commands: ['group', 'add', 'kick', 'promote', 'demote', 'tagall', 'mute', 'antilink', 'antibadword', 'adminsonly', 'groupmode', 'goodbye'] },
    fun: { title: 'FUN MENU', emoji: '🎮', commands: ['joke', 'fact', 'quote', 'anime', 'animepic', 'nsfw'] },
    ai: { title: 'AI MENU', emoji: '🤖', commands: ['ai', 'chatbot', 'image', 'translate'] },
    tools: { title: 'TOOLS MENU', emoji: '🛠️', commands: ['shorturl', 'tourl', 'toimg', 'apk', 'news', 'weather', 'getpp', 'autoviewonce', 'setprefix'] },
    download: { title: 'DOWNLOAD MENU', emoji: '📥', commands: ['play', 'song', 'ytmp3', 'ytmp4', 'video', 'tiktok', 'instagram', 'facebook', 'twitter', 'spotify', 'pinterest', 'mediafire'] },
    owner: { title: 'OWNER MENU', emoji: '👑', commands: ['owner', 'pair', 'broadcast', 'backup', 'ban', 'unban', 'delete', 'setbotdp', 'setname', 'setbio'] }
}

const CATEGORY_ORDER = Object.keys(CATEGORIES)

const COMMAND_EMOJIS = {
    ping:'🏓', alive:'💚', profile:'👤', help:'❓', repo:'📦', gitclone:'🐙', npm:'📚', calculate:'🧮',
    group:'⚙️', add:'➕', kick:'👢', promote:'⬆️', demote:'⬇️', tagall:'📢', mute:'🔇', antilink:'🔗', antibadword:'🛡️', adminsonly:'👮', groupmode:'🎛️', goodbye:'👋',
    joke:'😂', fact:'🧠', quote:'💬', anime:'🌸', animepic:'🖼️', nsfw:'🔞',
    ai:'🤖', chatbot:'💭', image:'🎨', translate:'🌐',
    shorturl:'🔗', tourl:'☁️', toimg:'🖼️', apk:'📱', news:'📰', weather:'🌤️', getpp:'🧑‍🎨', autoviewonce:'👁️', setprefix:'⚙️',
    play:'🎵', song:'🎶', ytmp3:'🎧', ytmp4:'🎬', video:'📹', tiktok:'🎵', instagram:'📸', facebook:'📘', twitter:'🐦', spotify:'🟢', pinterest:'📌', mediafire:'📁',
    owner:'👑', pair:'📲', broadcast:'📡', backup:'💾', ban:'🚫', unban:'♻️', delete:'🗑️', setbotdp:'🖼️', setname:'✏️', setbio:'📝'
}

const DESCRIPTIONS = {
    ping:'Check bot speed', alive:'Check bot status', profile:'View your profile', help:'Command help', repo:'Bot repository', gitclone:'GitHub tools', npm:'NPM package lookup', calculate:'Calculate expressions',
    group:'Group management', add:'Add a member', kick:'Remove a member', promote:'Promote to admin', demote:'Remove admin', tagall:'Mention everyone', mute:'Mute group chat', antilink:'Protect against links', antibadword:'Block bad words', adminsonly:'Admin-only mode', groupmode:'Group mode settings', goodbye:'Goodbye settings',
    joke:'Random jokes', fact:'Interesting facts', quote:'Inspirational quotes', anime:'Anime search', animepic:'Anime pictures', nsfw:'NSFW content',
    ai:'Ask NOX AI', chatbot:'AI chatbot', image:'Generate/search images', translate:'Translate text',
    shorturl:'Shorten a URL', tourl:'Upload media to URL', toimg:'Convert media to image', apk:'APK information', news:'Latest news search', weather:'Weather information', getpp:'Get profile picture', autoviewonce:'View-once tools', setprefix:'Change bot prefix',
    play:'Search and play music', song:'Download a song', ytmp3:'YouTube to MP3', ytmp4:'YouTube to MP4', video:'Search/download video', tiktok:'TikTok downloader', instagram:'Instagram downloader', facebook:'Facebook downloader', twitter:'Twitter downloader', spotify:'Spotify search', pinterest:'Pinterest search', mediafire:'MediaFire downloader',
    owner:'Owner information', pair:'Generate WhatsApp pairing code', broadcast:'Broadcast messages', backup:'Backup bot data', ban:'Ban a user', unban:'Unban a user', delete:'Delete a message', setbotdp:'Change bot picture', setname:'Change bot name', setbio:'Change bot bio'
}

function handler() { return require('../handler/commandHandler') }

function unwrap(message = {}) {
    let current = message
    for (let i = 0; i < 8; i++) {
        const next = current?.ephemeralMessage?.message || current?.viewOnceMessage?.message || current?.viewOnceMessageV2?.message || current?.documentWithCaptionMessage?.message
        if (!next) break
        current = next
    }
    return current || {}
}

function getBody(msg) {
    try {
        const m = unwrap(msg?.message || {})
        return String(m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || m.documentMessage?.caption || m.buttonsResponseMessage?.selectedButtonId || m.listResponseMessage?.singleSelectReply?.selectedRowId || m.templateButtonReplyMessage?.selectedId || '').trim()
    } catch (_) { return '' }
}

function participantKeys(msg) {
    const key = msg?.key || {}
    const from = String(key.remoteJid || '')
    const values = [
        key.participant,
        key.participantAlt,
        from,
        from ? from.split(':')[0] : '',
        key.participant ? String(key.participant).split(':')[0] : '',
        key.participantAlt ? String(key.participantAlt).split(':')[0] : ''
    ].filter(Boolean).map(String)
    return [...new Set(values)]
}

function remember(msg, state) {
    const data = { ...state, time: Date.now() }
    for (const key of participantKeys(msg)) global.menuReplies[key] = data
}

function stateFor(msg) {
    for (const key of participantKeys(msg)) {
        const state = global.menuReplies[key]
        if (state && Date.now() - state.time <= 300000) return state
    }
    return null
}

function clear(msg) {
    for (const key of participantKeys(msg)) delete global.menuReplies[key]
}

function exists(name) {
    const cmd = handler().commands.get(name)
    return !!(cmd && typeof cmd.execute === 'function')
}

function categoryCommands(category) {
    return (CATEGORIES[category]?.commands || []).filter(exists)
}

function footer() {
    return `📢 Channel: ${settings.channel || 'NOX SPARROW CHANNEL'}\n⚡ Powered by: ${settings.ownerName || 'NOX STAR.B'}`
}

function mainMenu(msg) {
    const prefix = settings.prefix || '.'
    const name = msg?.pushName || 'User'
    const rows = [
        `👤 User: ${name}`,
        `⚡ Prefix: ${prefix}`,
        `📦 Available Commands: ${handler().commands.size}`,
        '',
        '┣━━〔 📂 CATEGORIES 〕━━⬣'
    ]
    CATEGORY_ORDER.forEach((key, i) => {
        const c = CATEGORIES[key]
        rows.push(`┃ ${i + 1}️⃣ ${c.emoji} ${c.title} • ${categoryCommands(key).length} commands`)
    })
    rows.push('┣━━━━━━━━━━━━━━━━━━━━━━⬣')
    rows.push('┃ 💬 Reply with a number to open a category')
    rows.push('┃ ✨ Example: 1')
    rows.push(`┃ ⌨️ Or type ${prefix}command directly`)
    rows.push('╰━━━━━━━━━━━━━━━━━━━━━━⬣')
    rows.push('', footer())
    return `╭━━━〔 🦅 ${settings.botName || 'NOX SPARROW BOT'} 〕━━━⬣\n┃\n${rows.map(x => x ? `┃ ${x}` : '┃').join('\n')}`
}

function categoryMenu(category) {
    const c = CATEGORIES[category]
    const list = categoryCommands(category)
    const out = [`╭━━━〔 ${c.emoji} ${c.title} 〕━━━⬣`, '┃']
    list.forEach((name, i) => {
        const cmd = handler().commands.get(name)
        out.push(`┃ ${i + 1}️⃣ ${COMMAND_EMOJIS[name] || '🔹'} ${name} — ${DESCRIPTIONS[name] || cmd.description || 'Bot command'}`)
    })
    out.push('┣━━━━━━━━━━━━━━━━━━━━━━⬣')
    out.push('┃ 0️⃣ 🔙 Back to main menu')
    out.push(`┃ 💬 Reply with 1-${list.length} to run a command`)
    out.push('┃ ✨ Example: 1 hello')
    out.push('╰━━━━━━━━━━━━━━━━━━━━━━⬣')
    out.push('', footer())
    return out.join('\n')
}

async function send(sock, msg, text, state) {
    const from = msg?.key?.remoteJid
    if (!from || !sock || typeof sock.sendMessage !== 'function') return false

    let sent
    try {
        // Keep the menu itself text-only for maximum Baileys compatibility.
        // Command responses can still use the branded UI layer.
        sent = await sock.sendMessage(from, { text }, { quoted: msg })
    } catch (err) {
        console.error(`❌ MENU SEND FAILED | ${err.message || err}`)
        return false
    }

    remember(msg, { ...state, menuMessageId: sent?.key?.id || null })
    console.log(`✅ MENU SENT | chat=${from} | state=${state.level}${state.category ? ':' + state.category : ''}`)
    return true
}

async function execute(sock, msg) {
    console.log(`📋 MENU COMMAND RECEIVED | chat=${msg?.key?.remoteJid || '-'} | sender=${msg?.key?.participant || msg?.key?.participantAlt || msg?.key?.remoteJid || '-'}`)
    return send(sock, msg, mainMenu(msg), { level: 'main', category: null })
}

function quotedId(msg) {
    const m = unwrap(msg?.message || {})
    return m?.extendedTextMessage?.contextInfo?.stanzaId || m?.imageMessage?.contextInfo?.stanzaId || m?.videoMessage?.contextInfo?.stanzaId || m?.documentMessage?.contextInfo?.stanzaId || null
}

async function replyHandler(sock, msg) {
    const body = getBody(msg)
    if (!body) return false
    const state = stateFor(msg)
    if (!state) {
        if (/^[0-9]/.test(body)) console.log(`ℹ️ NUMBER REPLY IGNORED | no active menu | chat=${msg?.key?.remoteJid || '-'} | body=${body}`)
        return false
    }

    const quoted = quotedId(msg)
    if (quoted && state.menuMessageId && String(quoted) !== String(state.menuMessageId)) return false

    const parts = body.trim().split(/\s+/)
    const number = Number(parts[0])
    if (!Number.isInteger(number) || !/^\d+$/.test(parts[0])) return false
    const args = parts.slice(1)

    if (state.level === 'main') {
        if (number < 1 || number > CATEGORY_ORDER.length) return false
        const category = CATEGORY_ORDER[number - 1]
        const list = categoryCommands(category)
        if (!list.length) return false
        await send(sock, msg, categoryMenu(category), { level: 'category', category })
        return true
    }

    if (state.level === 'category') {
        if (number === 0) {
            clear(msg)
            await send(sock, msg, mainMenu(msg), { level: 'main', category: null })
            return true
        }
        const list = categoryCommands(state.category)
        if (number < 1 || number > list.length) return false
        const commandName = list[number - 1]
        clear(msg)
        console.log(`🔢 MENU COMMAND | ${number} -> ${commandName} | args=${args.join(' ') || '-'}`)
        await handler().executeCommand(commandName, sock, msg, args)
        return true
    }
    return false
}

setInterval(() => {
    const now = Date.now()
    for (const key of Object.keys(global.menuReplies)) {
        if (!global.menuReplies[key] || now - global.menuReplies[key].time > 300000) delete global.menuReplies[key]
    }
}, 60000).unref()

module.exports = { name:'menu', aliases:['help','allmenu'], category:'main', description:'Beautiful numbered menu system', execute, replyHandler, categories:CATEGORIES, getBody }
