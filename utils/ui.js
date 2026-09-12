const fs = require('fs')
const path = require('path')
const settings = require('../settings')

const logoPath = path.resolve(__dirname, '..', settings.botImage || './media/bot.jpg')
let logoBuffer = null
try {
    if (fs.existsSync(logoPath)) logoBuffer = fs.readFileSync(logoPath)
} catch (_) {}

function line(char = '━', size = 28) {
    return char.repeat(size)
}

function footer() {
    const channel = settings.channel || ''
    const owner = settings.ownerName || 'NOX STAR.B'
    return [
        '',
        `╭━━〔 🦅 NOX SPARROW BOT 〕━━╮`,
        `┃ 📢 Channel: ${channel}`,
        `┃ ⚡ Powered by: ${owner}`,
        `╰${line('━', 27)}╯`
    ].join('\n')
}

function header(title = 'BOT') {
    return `╭━━〔 🦅 ${String(title).toUpperCase()} 〕━━╮`
}

function box(title, rows = []) {
    const out = [header(title)]
    for (const row of rows) out.push(`┃ ${row}`)
    out.push(`╰${line('━', 27)}╯`)
    return out.join('\n')
}

function isTextMessage(content) {
    return !!(content && typeof content === 'object' && typeof content.text === 'string')
}

function hasFooter(text) {
    return typeof text === 'string' && (
        text.includes(settings.channel || '__NOX_CHANNEL__') ||
        text.includes('Powered by:') ||
        text.includes('POWERED BY NOX')
    )
}

function decorateText(text) {
    if (hasFooter(text)) return text
    return `${text}${footer()}`
}

function addBranding(content) {
    if (!content || typeof content !== 'object') return content

    const out = { ...content }
    const isReplyContent =
        typeof out.text === 'string' ||
        typeof out.caption === 'string' ||
        !!out.image || !!out.video || !!out.audio || !!out.document || !!out.sticker

    // Never touch protocol/control messages such as { delete: ... }.
    if (!isReplyContent) return out

    if (typeof out.text === 'string') out.text = decorateText(out.text)
    if (typeof out.caption === 'string') out.caption = decorateText(out.caption)

    // Attach the real bot logo as WhatsApp rich-message thumbnail metadata.
    // This keeps normal text/media responses intact while giving every command
    // response consistent NOX SPARROW branding.
    if (logoBuffer) {
        const current = out.contextInfo || {}
        if (!current.externalAdReply) {
            out.contextInfo = {
                ...current,
                externalAdReply: {
                    ...(current.externalAdReply || {}),
                    title: settings.botName || 'NOX SPARROW BOT',
                    body: `⚡ Powered by ${settings.ownerName || 'NOX STAR.B'}`,
                    thumbnail: logoBuffer,
                    sourceUrl: settings.channel || undefined,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: false
                }
            }
        }
    }

    return out
}

function createBrandedSocket(sock, commandName = '') {
    if (!sock || typeof sock.sendMessage !== 'function') return sock

    if (sock.__noxBrandedProxies) {
        return sock.__noxBrandedProxies.get(commandName) || sock
    }

    const cache = new Map()
    Object.defineProperty(sock, '__noxBrandedProxies', {
        value: cache,
        enumerable: false,
        configurable: false,
        writable: false
    })

    const proxy = new Proxy(sock, {
        get(target, prop, receiver) {
            if (prop !== 'sendMessage') return Reflect.get(target, prop, receiver)
            return async function brandedSendMessage(jid, content, options) {
                let finalContent = addBranding(content)

                // The first response of every command is upgraded to the real
                // bot-logo card when the command sends a text-only message.
                // Later messages stay lightweight but retain branded metadata.
                if (typeof finalContent?.text === 'string' && logoBuffer && !target.__noxBrandFirstSent) {
                    target.__noxBrandFirstSent = true
                    const caption = finalContent.text
                    const imageContent = {
                        image: logoBuffer,
                        caption,
                        ...(finalContent.mentions ? { mentions: finalContent.mentions } : {}),
                        ...(finalContent.contextInfo ? { contextInfo: finalContent.contextInfo } : {})
                    }
                    return target.sendMessage(jid, imageContent, options)
                }

                return target.sendMessage(jid, finalContent, options)
            }
        }
    })

    cache.set(commandName, proxy)
    return proxy
}

function resetCommandBranding(sock) {
    if (sock) sock.__noxBrandFirstSent = false
}

module.exports = {
    footer,
    header,
    box,
    addBranding,
    createBrandedSocket,
    resetCommandBranding,
    logoBuffer
}
