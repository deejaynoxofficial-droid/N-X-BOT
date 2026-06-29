require("dotenv").config();

module.exports = {
    // BOT INFO
    botName: process.env.BOT_NAME || "𝙽𝙾𝚇 𝚂𝙿𝙰𝚁𝚁𝙾𝚆 𝙱𝙾𝚃",
    botVersion: "1.0.0",

    ownerName: process.env.OWNER_NAME || "NOX STAR.B",
    ownerNumber: process.env.OWNER_NUMBER || "256700000000",
    ownerNumbers: [
        process.env.OWNER_NUMBER || "256700000000"
    ],

    footer: "© POWERED BY NOX STAR.B",

    // PREFIX
    prefix: process.env.PREFIX || ".",
    multiPrefix: false,
    prefixes: ["."],

    // SESSION
    sessionName: "session",
    sessionFolder: "./sessions",

    // CONNECTION
    connectTimeout: 60000,
    socketKeepAlive: 10000,
    queryTimeout: 60000,
    reconnectDelay: 5000,

    // MODE
    publicMode: true,
    maintenance: false,

    // AUTO FEATURES
    autoRead: false,
    autoTyping: false,
    autoRecording: false,
    autoStatusView: false,
    autoSticker: false,
    autoReply: false,
    autoChatbot: false,

    // GROUP
    welcome: false,
    goodbye: false,
    antiLink: false,
    antiBadword: false,
    antiDelete: true,
    antiViewOnce: true,
    antiSpam: false,
    antiBot: false,
    antiCall: true,
    nsfw: false,

    // LIMITS
    spamLimit: 5,
    spamCooldown: 10,
    enableCooldown: true,
    dailyLimit: 20,
    premiumLimit: 9999,
    cooldown: 3,

    // EMOJIS
    reactEmoji: "🔥",
    successEmoji: "✅",
    errorEmoji: "❌",
    waitEmoji: "⏳",

    // STICKERS
    stickerPackname: "NOX SPARROW BOT",
    stickerAuthor: "NOX STAR.B",

    // PATHS
    botImage: "./media/bot.jpg",
    thumbnail: "./media/ai.jpg",
    database: "./database/database.json",
    premiumDB: "./database/premium.json",
    bannedDB: "./database/banned.json",
    tempFolder: "./temp",
    logsFolder: "./logs",

    // MEDIA
    maxUploadSize: 100 * 1024 * 1024,
    maxVideoDuration: 60,
    ffmpegPath: "ffmpeg",

    // API KEYS
    apiKey: process.env.API_KEY || "",
    openaiKey: process.env.OPENAI_KEY || "",
    geminiKey: process.env.GEMINI_KEY || "",

    // CHANNEL
    channel: "https://whatsapp.com/channel/0029VbCnWMi2ZjCgC3ISe73b",

    // TIMEZONE
    timezone: "Africa/Kampala"
};
