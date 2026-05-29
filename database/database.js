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
// CREATE FOLDER
//========================================

const databaseFolder =
    path.dirname(databasePath)

if (!fs.existsSync(databaseFolder)) {

    fs.mkdirSync(databaseFolder, {
        recursive: true
    })
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
                    : 'private'
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
// CREATE DATABASE
//========================================

function createDatabase() {

    try {

        if (!fs.existsSync(databasePath)) {

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
            '❌ DATABASE CREATE ERROR'
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

        if (!fs.existsSync(databasePath)) {

            createDatabase()

            return defaultDatabase
        }

        const raw =
            fs.readFileSync(
                databasePath,
                'utf8'
            )

        if (!raw || raw.trim() === '') {

            saveDatabase(defaultDatabase)

            return defaultDatabase
        }

        let data

        try {

            data = JSON.parse(raw)

        } catch {

            console.log(
                '❌ DATABASE CORRUPTED'
            )

            saveDatabase(defaultDatabase)

            return defaultDatabase
        }

        // SAFE STRUCTURE

        if (!data.users)
            data.users = {}

        if (!data.groups)
            data.groups = {}

        if (!data.settings)
            data.settings = {}

        if (!data.statistics)
            data.statistics = {}

        return data

    } catch (err) {

        console.log(
            '❌ LOAD DATABASE ERROR'
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
            '❌ SAVE DATABASE ERROR'
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

        if (!id) return null

        const db =
            loadDatabase()

        if (!db.users[id]) {

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
            '❌ GET USER ERROR'
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

        if (!id) return null

        const db =
            loadDatabase()

        if (!db.groups[id]) {

            db.groups[id] = {

                welcome: false,

                goodbye: false,

                mute: false,

                antiLink: false,

                antiSpam: false
            }

            saveDatabase(db)
        }

        return db.groups[id]

    } catch (err) {

        console.log(
            '❌ GET GROUP ERROR'
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

        if (!db.statistics[type]) {

            db.statistics[type] = 0
        }

        db.statistics[type] += 1

        saveDatabase(db)

    } catch (err) {

        console.log(
            '❌ UPDATE STATS ERROR'
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
