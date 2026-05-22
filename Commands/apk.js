const axios = require("axios")
const settings = require("../settings")

async function fetchJson(endpoint) {

try {

const url =
`${settings.apiBase}${endpoint}&apikey=${settings.apiKey}`

const { data } = await axios.get(url)

return data

} catch (err) {

console.log(err)

return null

}

}

module.exports = {
fetchJson
}