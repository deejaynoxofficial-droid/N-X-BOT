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

// Map to hold active socket connections in memory
const activeSockets = new Map();

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
    let phoneNumber = req.query.number || req.query.phone || req.query.code;

    if (!phoneNumber) {
        return res.status(400).json({
            status: false,
            error: "Please provide a valid phone number."
        });
    }

    const sanitizedNumber = phoneNumber.replace(/[^0-9]/g, "");

    try {
        const numberSessionFolder = path.join(SESSION_PATH, sanitizedNumber);

        // If an active socket already exists for this number, close it first
        if (activeSockets.has(sanitizedNumber)) {
            try {
                activeSockets.get(sanitizedNumber).end(undefined);
            } catch (e) {}
            activeSockets.delete(sanitizedNumber);
        }

        // Clean up partial session files if not registered
        if (fs.existsSync(numberSessionFolder)) {
            const credsPath = path.join(numberSessionFolder, "creds.json");
            if (!fs.existsSync(credsPath)) {
                fs.rmSync(numberSessionFolder, { recursive: true, force: true });
            }
        }

        const { state, saveCreds } = await useMultiFileAuthState(numberSessionFolder);

        const socket = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true
        });

        // Store active socket in global memory map to prevent garbage collection
        activeSockets.set(sanitizedNumber, socket);

        socket.ev.on("creds.update", saveCreds);

        socket.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
                console.log(`✅ Connection linked successfully for: ${sanitizedNumber}`);
            } else if (connection === "close") {
                console.log(`ℹ️ Socket closed for: ${sanitizedNumber}`);
                activeSockets.delete(sanitizedNumber);
            }
        });

        if (!socket.authState.creds.registered) {
            await delay(3000); // Allow socket connection to establish fully

            const rawCode = await socket.requestPairingCode(sanitizedNumber);
            const formattedCode = rawCode?.match(/.{1,4}/g)?.join("-") || rawCode;

            return res.status(200).json({
                status: true,
                code: formattedCode,
                pairingCode: formattedCode,
                number: sanitizedNumber
            });
        } else {
            return res.status(400).json({
                status: false,
                error: "This number is already registered!"
            });
        }
    } catch (error) {
        console.error("Pairing Error:", error);
        return res.status(500).json({
            status: false,
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
