require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
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

app.get("/pair", async (req, res) => {
    const phoneNumber = req.query.number;

    if (!phoneNumber) {
        return res.status(400).json({
            error: "Please provide a phone number. Example: /pair?number=15551234567"
        });
    }

    const sanitizedNumber = phoneNumber.replace(/[^0-9]/g, "");

    try {
        const numberSessionFolder = path.join(SESSION_PATH, sanitizedNumber);
        const { state, saveCreds } = await useMultiFileAuthState(numberSessionFolder);

        const socket = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" })
        });

        socket.ev.on("creds.update", saveCreds);

        if (!socket.authState.creds.registered) {
            await delay(1500);
            const pairingCode = await socket.requestPairingCode(sanitizedNumber);

            return res.status(200).json({
                status: "success",
                number: sanitizedNumber,
                pairingCode: pairingCode
            });
        } else {
            return res.status(400).json({
                error: "This phone number is already registered!"
            });
        }
    } catch (error) {
        console.error("Pairing Error:", error);
        return res.status(500).json({
            error: "Failed to generate pairing code. Please try again."
        });
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
