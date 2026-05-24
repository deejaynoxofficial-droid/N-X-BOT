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

    // MAIN OWNER
    ownerNumber:
        '256748752152',

    // EXTRA OWNERS
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

    // IMPORTANT FOR OWNER COMMANDS
    selfCommands:
        true,

    //========================================
    // COMMAND SETTINGS
    //========================================

    replyCommands:
        true,

    commandReaction:
        false,

    commandLogs:
        true,

    commandCooldown:
        3,

    deleteInvalidCommands:
        false,

    //========================================
    // MENU SETTINGS
    //========================================

    menuType:
        'grouped',

    menuEmoji:
        true,

    menuReply:
        true,

    //========================================
    // AUTO FEATURES
    //========================================

    autoRead:
        false,

    // SAFER
    autoTyping:
        false,

    autoRecording:
        false,

    autoStatusView:
        false,

    autoSticker:
        false,

    autoReply:
        false,

    autoChatbot:
        false,

    //========================================
    // GROUP SETTINGS
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
        false,

    // DISABLE UNTIL STABLE
    antiViewOnce:
        false,

    antiSpam:
        false,

    antiBot:
        false,

    antiCall:
        false,

    nsfw:
        false,

    //========================================
    // SECURITY SETTINGS
    //========================================

    antiCrash:
        true,

    antiBug:
        true,

    antiFlood:
        true,

    antiCommandSpam:
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
            'https://api.botcahx.eu.org'
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
    // TIMEZONE
    //========================================

    timezone:
        'Africa/Kampala',

    //========================================
    // SOCKET SETTINGS
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
