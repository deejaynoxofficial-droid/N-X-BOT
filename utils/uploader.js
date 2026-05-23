const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')
const settings = require('../settings')

async function uploadFile(file) {

    try {

        if (
            !file ||
            typeof file !== 'string'
        ) {
            return {
                status: false,
                message: 'Invalid file path.'
            }
        }

        if (
            !fs.existsSync(file)
        ) {
            return {
                status: false,
                message: 'File not found.'
            }
        }

        if (
            !settings ||
            typeof settings !==
                'object'
        ) {
            return {
                status: false,
                message: 'Settings configuration missing.'
            }
        }

        if (
            !settings.APIs ||
            typeof settings.APIs.neoxr !==
                'string'
        ) {
            return {
                status: false,
                message: 'Upload API not configured.'
            }
        }

        if (
            typeof settings.apiKey !==
                'string' ||
            settings.apiKey.trim() === ''
        ) {
            return {
                status: false,
                message: 'API key missing.'
            }
        }

        const stats =
            fs.statSync(file)

        if (
            !stats ||
            !stats.isFile()
        ) {
            return {
                status: false,
                message: 'Invalid file.'
            }
        }

        const maxSize =
            100 * 1024 * 1024

        if (
            stats.size > maxSize
        ) {
            return {
                status: false,
                message:
                    'File exceeds 100MB limit.'
            }
        }

        const form =
            new FormData()

        form.append(
            'file',
            fs.createReadStream(file),
            path.basename(file)
        )

        const response =
            await axios.post(

                `${settings.APIs.neoxr}/api/upload?apikey=${encodeURIComponent(settings.apiKey)}`,

                form,

                {
                    headers: {
                        ...form.getHeaders()
                    },

                    maxBodyLength:
                        Infinity,

                    maxContentLength:
                        Infinity,

                    timeout: 120000,

                    validateStatus:
                        status =>
                            status >= 200 &&
                            status < 500
                }
            )

        if (
            !response ||
            typeof response !==
                'object'
        ) {
            return {
                status: false,
                message:
                    'Invalid API response.'
            }
        }

        if (
            response.status !== 200
        ) {
            return {
                status: false,
                message:
                    `Upload failed with status ${response.status}`
            }
        }

        const data =
            response.data

        if (
            !data ||
            typeof data !==
                'object'
        ) {
            return {
                status: false,
                message:
                    'Malformed API response.'
            }
        }

        return {
            status: true,
            result: data
        }

    } catch (error) {

        console.log(
            'Upload File Error:',
            error
        )

        return {
            status: false,
            message:
                'Failed to upload file.'
        }
    }
}

module.exports = {
    uploadFile
}