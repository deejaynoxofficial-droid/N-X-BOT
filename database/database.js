const fs = require('fs')

const path = require('path')

const settings =
    require('../settings')

//========================================
// DATABASE PATH
//========================================

const databasePath =
    settings.database

//========================================
// CREATE DATABASE FOLDER
//========================================

const databaseFolder =
    path.dirname(
        databasePath
    )

if (
    !fs.existsSync(
        databaseFolder
    )
) {

    fs.mkdirSync(
        databaseFolder,
        {
            recursive: true
        }
    )
}

//========================================
// DEFAULT DATABASE
//========================================

const defaultDatabase = {

    users: {},

    groups: {},

    settings: {

        bot: {

            prefix:
                settings.prefix || '.',

            mode:
                settings.publicMode
                    ? 'public'
                    : 'private',

            autoRead:
                settings.autoRead || false,

            autoTyping:
                settings.autoTyping || false,

            autoRecording:
                settings.autoRecording || false,

            autoSticker:
                settings.autoSticker || false,

            autoReply:
                settings.autoReply || false,

            autoReplyMessage:
                '🤖 Hello, I am currently busy.',

            autoViewOnce:
                settings.antiViewOnce || false,

            autoViewOnceMode:
                'private',

            antiCall:
                settings.antiCall || false
        },

        owner: {

            numbers:
                settings.ownerNumbers || []
        },

        apis: {

            neoxr: '',

            apiKey: ''
        }
    },

    chatbot: {

        enabled: true
    },

    broadcasts: [],

    downloads: {},

    stickers: {},

    statistics: {

        commands: 0,

        messages: 0,

        users: 0,

        groups: 0
    }
}

//========================================
// CREATE DATABASE FILE
//========================================

function createDatabase() {

    try {

        if (
            !fs.existsSync(
                databasePath
            )
        ) {

            fs.writeFileSync(

                databasePath,

                JSON.stringify(
                    defaultDatabase,
                    null,
                    2
                )
            )

            console.log(
                '✅ Database Created'
            )
        }

    } catch (error) {

        console.log(
            '❌ CREATE DATABASE ERROR:'
        )

        console.log(error)
    }
}

createDatabase()

//========================================
// LOAD DATABASE
//========================================

function loadDatabase() {

    try {

        const raw =

            fs.readFileSync(
                databasePath,
                'utf8'
            )

        // EMPTY FILE FIX

        if (
            !raw ||
            raw.trim() === ''
        ) {

            saveDatabase(
                defaultDatabase
            )

            return defaultDatabase
        }

        const data =
            JSON.parse(raw)

        // INVALID FIX

        if (
            !data ||
            typeof data !==
                'object'
        ) {

            saveDatabase(
                defaultDatabase
            )

            return defaultDatabase
        }

        // SAFE STRUCTURE

        data.users =
            data.users || {}

        data.groups =
            data.groups || {}

        data.settings =
            data.settings || {}

        data.statistics =
            data.statistics || {}

        return data

    } catch (error) {

        console.log(
            '❌ DATABASE LOAD ERROR:'
        )

        console.log(error)

        // AUTO REPAIR

        try {

            saveDatabase(
                defaultDatabase
            )

        } catch {}

        return defaultDatabase
    }
}

//========================================
// SAVE DATABASE
//========================================

function saveDatabase(data) {

    try {

        if (
            !data ||
            typeof data !==
                'object'
        ) {
            return false
        }

        fs.writeFileSync(

            databasePath,

            JSON.stringify(
                data,
                null,
                2
            )
        )

        return true

    } catch (error) {

        console.log(
            '❌ DATABASE SAVE ERROR:'
        )

        console.log(error)

        return false
    }
}

//========================================
// GET USER
//========================================

function getUser(id) {

    try {

        if (
            !id ||
            typeof id !==
                'string'
        ) {
            return null
        }

        const db =
            loadDatabase()

        if (
            !db.users[id]
        ) {

            db.users[id] = {

                premium: false,

                banned: false,

                limit:
                    settings.dailyLimit || 20,

                warnings: 0,

                exp: 0,

                level: 1,

                lastCommand: 0
            }

            saveDatabase(db)
        }

        return db.users[id]

    } catch (error) {

        console.log(
            '❌ GET USER ERROR:'
        )

        console.log(error)

        return null
    }
}

//========================================
// GET GROUP
//========================================

function getGroup(id) {

    try {

        if (
            !id ||
            typeof id !==
                'string'
        ) {
            return null
        }

        const db =
            loadDatabase()

        if (
            !db.groups[id]
        ) {

            db.groups[id] = {

                welcome:
                    settings.welcome || false,

                goodbye:
                    settings.goodbye || false,

                mute: false,

                nsfw:
                    settings.nsfw || false,

                adminsOnly: false,

                groupmode: 'open',

                antiLink: {

                    enabled:
                        settings.antiLink || false,

                    mode: 'delete'
                },

                antiBadWord: {

                    enabled:
                        settings.antiBadword || false,

                    mode: 'delete'
                },

                antiSpam: {

                    enabled:
                        settings.antiSpam || false,

                    limit:
                        settings.spamLimit || 5
                },

                warnings: {}
            }

            saveDatabase(db)
        }

        return db.groups[id]

    } catch (error) {

        console.log(
            '❌ GET GROUP ERROR:'
        )

        console.log(error)

        return null
    }
}

//========================================
// UPDATE STATS
//========================================

function updateStats(
    type
) {

    try {

        const db =
            loadDatabase()

        if (
            !db.statistics
        ) {

            db.statistics = {}
        }

        if (
            !db.statistics[type]
        ) {

            db.statistics[type] = 0
        }

        db.statistics[type] += 1

        saveDatabase(db)

    } catch (error) {

        console.log(
            '❌ UPDATE STATS ERROR:'
        )

        console.log(error)
    }
}

//========================================
// EXPORTS
//========================================

module.exports = {

    loadDatabase,

    saveDatabase,

    getUser,

    getGroup,

    updateStats
                }
