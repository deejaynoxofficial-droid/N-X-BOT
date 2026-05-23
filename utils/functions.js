function runtime(seconds) {

    try {

        if (
            seconds === undefined ||
            seconds === null
        ) {
            seconds = 0
        }

        seconds = Number(seconds)

        if (
            Number.isNaN(seconds) ||
            seconds < 0
        ) {
            seconds = 0
        }

        const d = Math.floor(
            seconds / (3600 * 24)
        )

        const h = Math.floor(
            (seconds % (3600 * 24)) / 3600
        )

        const m = Math.floor(
            (seconds % 3600) / 60
        )

        const s = Math.floor(
            seconds % 60
        )

        const dDisplay =
            d > 0
                ? `${d}d `
                : ''

        const hDisplay =
            h > 0
                ? `${h}h `
                : ''

        const mDisplay =
            m > 0
                ? `${m}m `
                : ''

        const sDisplay =
            s > 0
                ? `${s}s`
                : '0s'

        return (
            dDisplay +
            hDisplay +
            mDisplay +
            sDisplay
        ).trim()

    } catch {

        return '0s'
    }
}

// RANDOM FILE NAME
function getRandom(ext = '') {

    try {

        if (
            typeof ext !== 'string'
        ) {
            ext = ''
        }

        return `${Math.floor(
            Math.random() * 100000
        )}${ext}`

    } catch {

        return `file${Date.now()}`
    }
}

// URL CHECKER
function isUrl(url) {

    try {

        if (
            !url ||
            typeof url !== 'string'
        ) {
            return false
        }

        const regex =
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi

        return Boolean(
            url.match(regex))

    } catch {

        return false
    }
}

// FORMAT NUMBER
function formatNumber(num) {

    try {

        if (
            num === undefined ||
            num === null
        ) {
            num = 0
        }

        const parsed =
            Number(num)

        if (
            Number.isNaN(parsed)
        ) {
            return '0'
        }

        return parsed
            .toString()
            .replace(
                /\B(?=(\d{3})+(?!\d))/g,
                ','
            )

    } catch {

        return '0'
    }
}

module.exports = {

    runtime,
    getRandom,
    isUrl,
    formatNumber
}
