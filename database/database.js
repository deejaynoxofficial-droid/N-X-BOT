const fs = require('fs')
const settings = require('../settings')

const databasePath =
    settings.database

// CREATE DATABASE
if (
    !fs.existsSync(databasePath)
) {

    fs.writeFileSync(
        databasePath,

        JSON.stringify(
            {

                users: {},

                groups: {},

                settings: {

                    bot: {

                        prefix: '.',

                        mode: 'public',

                        autoRead: false,

                        autoTyping: false,

                        autoRecording: false,

                        autoSticker: false,

                        autoReply: false,

                        autoReplyMessage:
                            '🤖 Hello, I am currently busy.',

                        autoViewOnce: false,

                        autoViewOnceMode:
                            'private',

                        antiCall: false
                    },

                    owner: {

                        numbers: [
                            '256700000000'
                        ]
                    },

                    apis: {

                        neoxr: '',

                        apiKey: ''
                    }
                },

                statistics: {

                    commands: 0,

                    messages: 0,

                    users: 0,

                    groups: 0
                }
            },

            null,
            2
        )
    )
}

// LOAD DATABASE
function loadDatabase() {

    try {

        return JSON.parse(
            fs.readFileSync(
                databasePath,
                'utf8'
            )
        )

    } catch {

        return {

            users: {},

            groups: {},

            settings: {}
        }
    }
}

// SAVE DATABASE
function saveDatabase(data) {

    fs.writeFileSync(

        databasePath,

        JSON.stringify(
            data,
            null,
            2
        )
    )
}

// GET USER
function getUser(id) {

    const db =
        loadDatabase()

    if (
        !db.users[id]
    ) {

        db.users[id] = {

            premium: false,

            banned: false,

            limit:
                settings.dailyLimit || 10,

            warnings: 0
        }

        saveDatabase(db)
    }

    return db.users[id]
}

// GET GROUP
function getGroup(id) {

    const db =
        loadDatabase()

    if (
        !db.groups[id]
    ) {

        db.groups[id] = {

            welcome: false,

            goodbye: false,

            mute: false,

            nsfw: false,

            adminsOnly: false,

            groupmode: 'open',

            antiLink: {

                enabled: false,

                mode: 'delete'
            },

            antiBadWord: {

                enabled: false,

                mode: 'delete'
            },

            warnings: {}
        }

        saveDatabase(db)
    }

    return db.groups[id]
}

module.exports = {

    loadDatabase,

    saveDatabase,

    getUser,

    getGroup
}