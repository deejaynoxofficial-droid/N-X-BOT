require("dotenv").config()

const axios = require("axios")

const API_BASE = process.env.API_BASE
const API_KEY = process.env.API_KEY

async function fetchJson(endpoint) {

try {

const url =
`${API_BASE}${endpoint}&apikey=${API_KEY}`

const { data } = await axios.get(url)

return data

} catch (err) {

console.log("API ERROR:", err.message)

return null

}

}

module.exports = {
fetchJson
}