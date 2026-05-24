require('dotenv').config()

module.exports = {

    //========================================
    // BOT INFORMATION
    //========================================

    botName:
        '𝙽𝙾𝚇 𝚂𝙿𝙰𝚁𝚁𝙾𝚆 𝙱𝙾𝚃',

    botVersion:
        '1.0.0',

    ownerName:
        'NOX STAR.B',

    ownerNumber:
        '256745720308',

    ownerNumbers: [
        '256748752152'
    ],

    ownerEmoji:
        '👑',

    botEmoji:
        '🤖',

    footer:
        '© POWERED BY NOX STAR.B',

    //========================================
    // PREFIX SETTINGS
    //========================================

    prefix:
        '.',

    multiPrefix:
        false,

    prefixes: [
        '.'
    ],

    //========================================
    // SESSION SETTINGS
    //========================================

    sessionName:
        'session',

    sessionFolder:
        './sessions',

    //========================================
    // BOT MODES
    //========================================

    publicMode:
        true,

    maintenance:
        false,

    selfCommands:
        false,

    //========================================
    // AUTO FEATURES
    //========================================

    autoRead:
        false,

    autoTyping:
        true,

    autoRecording:
        false,

    autoStatusView:
        true,

    autoSticker:
        false,

    autoReply:
        false,

    autoChatbot:
        false,

    //========================================
    // GROUP DEFAULT SETTINGS
    //========================================

    welcome:
        false,

    goodbye:
        false,

    antiLink:
        false,

    antiBadword:
        false,

    antiDelete:
        true,

    antiViewOnce:
        true,

    antiSpam:
        false,

    antiBot:
        false,

    antiCall:
        true,

    nsfw:
        false,

    //========================================
    // SPAM SETTINGS
    //========================================

    spamLimit:
        5,

    spamCooldown:
        10,

    enableCooldown:
        true,

    //========================================
    // LIMIT SETTINGS
    //========================================

    dailyLimit:
        20,

    premiumLimit:
        9999,

    cooldown:
        3,

    //========================================
    // REACTIONS
    //========================================

    reactEmoji:
        '🔥',

    successEmoji:
        '✅',

    errorEmoji:
        '❌',

    waitEmoji:
        '⏳',

    //========================================
    // STICKER SETTINGS
    //========================================

    stickerPackname:
        'NOX SPARROW BOT',

    stickerAuthor:
        'NOX STAR.B',

    //========================================
    // MEDIA SETTINGS
    //========================================

    botImage:
        './media/bot.jpg',

    thumbnail:
        './media/ai.jpg',

    maxUploadSize:
        100 * 1024 * 1024,

    maxVideoDuration:
        60,

    ffmpegPath:
        'ffmpeg',

    //========================================
    // API KEYS
    //========================================

    apiKey:
        process.env.API_KEY || '',

    openaiKey:
        process.env.OPENAI_KEY || '',

    geminiKey:
        process.env.GEMINI_KEY || '',

    //========================================
    // API URLS
    //========================================

    APIs: {

        neoxr:
            'https://api.neoxr.eu',

        lolhuman:
            'https://api.lolhuman.xyz',

        botcahx:
            'https://api.botcahx.eu.org',

        openai:
            'https://api.openai.com/v1',

        gemini:
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'
    },

    //========================================
    // DATABASE SETTINGS
    //========================================

    database:
        './database/database.json',

    premiumDB:
        './database/premium.json',

    bannedDB:
        './database/banned.json',

    //========================================
    // TEMP & LOGS
    //========================================

    tempFolder:
        './temp',

    logsFolder:
        './logs',

    //========================================
    // CHANNEL
    //========================================

    channel:
        'https://whatsapp.com/channel/0029VbCnWMi2ZjCgC3ISe73b',

    //========================================
    // TIMEZONE
    //========================================

    timezone:
        'Africa/Kampala',

    //========================================
    // SOCKET MANAGER SETTINGS
    //========================================

    reconnectDelay:
        5000,

    cleanupInterval:
        600000,

    pairingTimeout:
        30000,

    maxPairSessions:
        100,

    socketKeepAlive:
        10000,

    connectTimeout:
        60000,

    queryTimeout:
        60000,

    maxReconnectAttempts:
        20,

    autoSessionCleanup:
        true,

    enablePairSocket:
        true
}
