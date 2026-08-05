require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");

// Import your Baileys socket manager
// Example: const { createSocket } = require("./socket");
const { createSocket } = require("./socket");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const SESSION_PATH = path.join(__dirname, "sessions");

process.on("uncaughtException", (err) => {
    console.error("[UNCAUGHT EXCEPTION]", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("[UNHANDLED REJECTION]", reason);
});

if (!fs.existsSync(SESSION_PATH)) {
    fs.mkdirSync(SESSION_PATH, { recursive: true });
}

app.disable("x-powered-by");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "online",
        uptime: process.uptime(),
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Pair Route
app.get("/pair", async (req, res) => {
    try {
        let phone = req.query.number;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Missing phone number. Example: /pair?number=2567XXXXXXXX"
            });
        }

        phone = phone.replace(/\D/g, "");

        if (phone.length < 8 || phone.length > 15) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number."
            });
        }

        const sock = await createSocket(phone);

        if (!sock) {
            return res.status(500).json({
                success: false,
                message: "Failed to initialize WhatsApp socket."
            });
        }

        const code = await sock.requestPairingCode(phone);

        return res.status(200).json({
            success: true,
            phone,
            pairingCode: code
        });

    } catch (err) {
        console.error("[PAIR ERROR]", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error."
        });
    }
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🤖 SERVER ONLINE
┃ 🌐 PORT: ${PORT}
┃ 📁 SESSION: ${SESSION_PATH}
┃ 🚀 READY
╰━━━━━━━━━━━━━━━━━━━━━━⬣
`);
});
