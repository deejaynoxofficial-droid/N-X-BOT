require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
// Make sure to install baileys: npm install @whiskeysockets/baileys
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const SESSION_PATH = path.join(__dirname, "sessions");

if (!fs.existsSync(SESSION_PATH)) {
    fs.mkdirSync(SESSION_PATH, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        port: PORT
    });
});

// ==========================================
// 📱 PAIRING CODE ROUTE
// ==========================================
app.get("/pair", async (req, res) => {
    const phoneNumber = req.query.number;

    if (!phoneNumber) {
        return res.status(400).json({ error: "Please provide a phone number. Example: /pair?number=2547XXXXXXXX" });
    }

    // Clean up non-numeric characters from the phone number
    const sanitizedNumber = phoneNumber.replace(/[^0-9]/g, "");

    try {
        const { state, saveCreds } = await useMultiFileAuthState(path.join(SESSION_PATH, sanitizedNumber));

        const socket = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: require("pino")({ level: "silent" })
        });

        socket.ev.on("creds.update", saveCreds);

        // Check if the number is not already registered on this session
        if (!socket.authState.creds.registered) {
            await delay(1500); // Small delay to allow socket initialization
            const code = await socket.requestPairingCode(sanitizedNumber);
            
            return res.status(200).json({
                status: "success",
                number: sanitizedNumber,
                pairingCode: code
            });
        } else {
            return res.status(400).json({ error: "This phone number is already registered!" });
        }
    } catch (error) {
        console.error("Pairing Error:", error);
        return res.status(500).json({ error: "Failed to generate pairing code. Please try again." });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🤖 SERVER ONLINE
┃ 🌐 PORT: ${PORT}
┃ 🚀 READY
╰━━━━━━━━━━━━━━━━━━━━━━⬣
`);
});
