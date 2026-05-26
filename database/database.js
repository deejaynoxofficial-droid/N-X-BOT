const fs = require('fs')
const path = require('path')

const settings = require('../settings')

//========================================
// DATABASE PATH
//========================================

const databasePath =
    settings.database ||
    './database/database.json'

//========================================
// DATABASE FOLDER
//========================================

const databaseFolder =
    path.dirname(databasePath)

//========================================
// CREATE DATABASE FOLDER
//========================================

try {

    if (
        !fs.existsSync(databaseFolder)
    ) {

        fs.mkdirSync(
            databaseFolder,
            {
                recursive: true
            }
        )
    }

} catch (err) {

    console.log(
        '❌ DATABASE FOLDER ERROR:'
    )

    console.log(err)
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

            antiCall:
                settings.antiCall || false
        },

        owner: {

            numbers:
                settings.ownerNumbers || []
        }
    },

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
            !fs.existsSync(databasePath)
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
                '✅ DATABASE CREATED'
            )
        }

    } catch (err) {

        console.log(
            '❌ CREATE DATABASE ERROR:'
        )

        console.log(err)
    }
}

createDatabase()

//========================================
// LOAD DATABASE
//========================================

function loadDatabase() {

    try {

        //========================================
        // FILE NOT FOUND
        //========================================

        if (
            !fs.existsSync(databasePath)
        ) {

            saveDatabase(
                defaultDatabase
            )

            return defaultDatabase
        }

        //========================================
        // READ FILE
        //========================================

        const raw =
            fs.readFileSync(
                databasePath,
                'utf8'
            )

        //========================================
        // EMPTY FILE FIX
        //========================================

        if (
            !raw ||
            raw.trim() === ''
        ) {

            console.log(
                '⚠️ EMPTY DATABASE FIXED'
            )

            saveDatabase(
                defaultDatabase
            )

            return defaultDatabase
        }

        //========================================
        // SAFE JSON PARSE
        //========================================

        let data

        try {

            data =
                JSON.parse(raw)

        } catch (parseError) {

            console.log(
                '❌ DATABASE CORRUPTED'
            )

            console.log(parseError)

            saveDatabase(
                defaultDatabase
            )

            return defaultDatabase
        }

        //========================================
        // INVALID OBJECT FIX
        //========================================

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

        //========================================
        // SAFE STRUCTURE
        //========================================

        data.users =
            data.users || {}

        data.groups =
            data.groups || {}

        data.settings =
            data.settings || {}

        data.statistics =
            data.statistics || {}

        return data

    } catch (err) {

        console.log(
            '❌ LOAD DATABASE ERROR:'
        )

        console.log(err)

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

    } catch (err) {

        console.log(
            '❌ SAVE DATABASE ERROR:'
        )

        console.log(err)

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

        //========================================
        // CREATE USER
        //========================================

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

    } catch (err) {

        console.log(
            '❌ GET USER ERROR:'
        )

        console.log(err)

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

        //========================================
        // CREATE GROUP
        //========================================

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

                antiLink:
                    settings.antiLink || false,

                antiBadword:
                    settings.antiBadword || false,

                antiSpam:
                    settings.antiSpam || false
            }

            saveDatabase(db)
        }

        return db.groups[id]

    } catch (err) {

        console.log(
            '❌ GET GROUP ERROR:'
        )

        console.log(err)

        return null
    }
}

//========================================
// UPDATE STATS
//========================================

function updateStats(type) {

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

    } catch (err) {

        console.log(
            '❌ UPDATE STATS ERROR:'
        )

        console.log(err)
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
