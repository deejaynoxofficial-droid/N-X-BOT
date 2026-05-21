const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  delay
} = require("@whiskeysockets/baileys");

const express = require("express");
const cors = require("cors");
const pino = require("pino");
const readline = require("readline");
const { Boom } = require("@hapi/boom");

// ==========================================
// CONFIG
// ==========================================
const PORT = process.env.PORT || 3000;
const PREFIX = ".";
const BOT_NAME = "NØX_STAR";
const OWNER_NAME = "MR.NOX STAR BOTS";
const OWNER_NUMBER = "256745720308";

// ==========================================
// EXPRESS SERVER
// ==========================================
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: true,
    bot: NØX BOT,
    owner: MR.NOX STAR BOTS
  });
});

app.listen(PORT, () => {
  console.log(`🌐 API Server running on port ${PORT}`);
});

// ==========================================
// READLINE
// ==========================================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (text) =>
  new Promise((resolve) => rl.question(text, resolve));

// ==========================================
// FONT SYSTEM
// ==========================================
const fontStyles = {
  1: (t) => t.toUpperCase().split("").join(" "),
  2: (t) => t.split("").map(c => c + "̶").join(""),
  3: (t) => `【${t}】`,
  4: (t) =>
    t.toLowerCase().replace(/[a-z]/g, c =>
      String.fromCharCode(c.charCodeAt(0) + 119951)
    ),
  5: (t) => t.split("").reverse().join("")
};

// ==========================================
// COMMAND HANDLER
// ==========================================
async function commandProcessor(sock, m) {
  try {
    if (!m.messages || !m.messages[0]) return;

    const msg = m.messages[0];

    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const from = msg.key.remoteJid;

    const isGroup = from.endsWith("@g.us");

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/ +/);

    const command = args.shift().toLowerCase();

    const sender =
      msg.key.participant || msg.key.remoteJid;

    const senderNumber =
      sender.replace(/[^0-9]/g, "");

    const isOwner = senderNumber === OWNER_NUMBER;

    const groupMetadata = isGroup
      ? await sock.groupMetadata(from)
      : null;

    const participants = isGroup
      ? groupMetadata.participants
      : [];

    // ==========================================
    // COMMANDS
    // ==========================================
    switch (command) {

      // ==========================
      // PING
      // ==========================
      case "ping":
      case "speed": {

        const start = Date.now();

        await sock.sendMessage(from, {
          text: "🏓 Testing speed..."
        });

        const end = Date.now();

        const speed = end - start;

        await sock.sendMessage(from, {
          text: `🚀 Pong!\n⚡ Speed: ${speed}ms`
        });

        break;
      }

      // ==========================
      // MENU
      // ==========================
      case "menu":
      case "help": {

        const menu = `
╭━━━〔 ${NØX_STAR} 〕━━━⬣
┃ 👑 Owner: ${MR.NOX STAR BOTS}
┃ ⚙️ Prefix: ${PREFIX}
╰━━━━━━━━━━━━━━⬣

╭━━〔 MAIN 〕━━⬣
┃ .ping
┃ .menu
┃ .loading
┃ .font
┃ .font1
┃ .font2
┃ .font3
┃ .font4
┃ .font5
┃ .ship
┃ .aura
┃ .tagall
┃ .kick
┃ .block
╰━━━━━━━━━━⬣
`;

        await sock.sendMessage(from, {
          text: menu
        });

        break;
      }

      // ==========================
      // LOADING
      // ==========================
      case "loading":
      case "progress": {

        const steps = [
          "⬜⬜⬜⬜⬜ 0%",
          "🟩⬜⬜⬜⬜ 20%",
          "🟩🟩🟩⬜⬜ 60%",
          "🟩🟩🟩🟩🟩 100%\n\n✅ Completed"
        ];

        for (const step of steps) {
          await sock.sendMessage(from, {
            text: step
          });

          await delay(800);
        }

        break;
      }

      // ==========================
      // FONT
      // ==========================
      case "font": {

        const textInput = args.join(" ");

        if (!textInput) {
          return sock.sendMessage(from, {
            text: "⚠️ Example: .font Nox Star"
          });
        }

        let response = "✨ FONT STYLES ✨\n\n";

        Object.keys(fontStyles).forEach((k) => {
          response += `Style ${k}: ${fontStyles[k](textInput)}\n\n`;
        });

        await sock.sendMessage(from, {
          text: response
        });

        break;
      }

      // ==========================
      // FONT1 - FONT5
      // ==========================
      case "font1":
      case "font2":
      case "font3":
      case "font4":
      case "font5": {

        const style = command.replace("font", "");

        const textInput = args.join(" ");

        if (!textInput) {
          return sock.sendMessage(from, {
            text: "⚠️ Enter text."
          });
        }

        await sock.sendMessage(from, {
          text: fontStyles[style](textInput)
        });

        break;
      }

      // ==========================
      // SHIP
      // ==========================
      case "ship":
      case "match": {

        if (!isGroup) {
          return sock.sendMessage(from, {
            text: "❌ Group only command."
          });
        }

        const p1 =
          participants[
            Math.floor(Math.random() * participants.length)
          ].id;

        const p2 =
          participants[
            Math.floor(Math.random() * participants.length)
          ].id;

        const score =
          Math.floor(Math.random() * 100) + 1;

        const result =
          score > 70
            ? "💎 Perfect Match"
            : "⚖️ Normal Match";

        await sock.sendMessage(from, {
          text:
            `💘 MATCH RESULT 💘\n\n` +
            `👤 @${p1.split("@")[0]}\n` +
            `❤️\n` +
            `👤 @${p2.split("@")[0]}\n\n` +
            `📊 Score: ${score}%\n` +
            `💬 ${result}`,
          mentions: [p1, p2]
        });

        break;
      }

      // ==========================
      // AURA
      // ==========================
      case "aura": {

        const target =
          msg.message.extendedTextMessage?.contextInfo
            ?.mentionedJid?.[0] || sender;

        const aura =
          Math.floor(Math.random() * 30000) - 10000;

        await sock.sendMessage(from, {
          text:
            `🔮 @${target.split("@")[0]}\n` +
            `Aura Score: ${aura}`,
          mentions: [target]
        });

        break;
      }

      // ==========================
      // TAGALL
      // ==========================
      case "tagall": {

        if (!isGroup) return;

        let broadMessage =
          "📢 GROUP TAG ALL\n\n";

        let mentionList = [];

        participants.forEach((p) => {
          broadMessage +=
            `⚡ @${p.id.split("@")[0]}\n`;

          mentionList.push(p.id);
        });

        await sock.sendMessage(from, {
          text: broadMessage,
          mentions: mentionList
        });

        break;
      }

      // ==========================
      // KICK
      // ==========================
      case "kick": {

        if (!isGroup) return;

        const target =
          msg.message.extendedTextMessage?.contextInfo
            ?.mentionedJid?.[0];

        if (!target) {
          return sock.sendMessage(from, {
            text: "⚠️ Mention user."
          });
        }

        await sock.groupParticipantsUpdate(
          from,
          [target],
          "remove"
        );

        await sock.sendMessage(from, {
          text: "✅ User removed."
        });

        break;
      }

      // ==========================
      // BLOCK
      // ==========================
      case "block": {

        if (!isOwner) {
          return sock.sendMessage(from, {
            text: "❌ Owner only."
          });
        }

        const target =
          msg.message.extendedTextMessage?.contextInfo
            ?.mentionedJid?.[0];

        if (!target) {
          return sock.sendMessage(from, {
            text: "⚠️ Mention target."
          });
        }

        await sock.updateBlockStatus(
          target,
          "block"
        );

        await sock.sendMessage(from, {
          text: "🔒 User blocked."
        });

        break;
      }

      default:
        break;
    }

  } catch (err) {
    console.log("ERROR:", err);
  }
}

// ==========================================
// START BOT
// ==========================================
async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState(
      "./nox_star_session"
    );

  const { version } =
    await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Nox Star", "Chrome", "1.0.0"]
  });

  // ==========================================
  // PAIRING CODE
  // ==========================================
  if (!sock.authState.creds.registered) {

    const phoneNumber =
      await question(
        "📱 Enter WhatsApp Number:\n"
      );

    const code =
      await sock.requestPairingCode(
        phoneNumber
      );

    console.log(
      `\n🔑 PAIRING CODE: ${code}\n`
    );
  }

  // ==========================================
  // CONNECTION UPDATE
  // ==========================================
  sock.ev.on(
    "connection.update",
    async (update) => {

      const {
        connection,
        lastDisconnect
      } = update;

      if (connection === "open") {

        console.clear();

        console.log("================================");
        console.log("✅ BOT CONNECTED SUCCESSFULLY");
        console.log(`🤖 ${NØX BOT}`);
        console.log("================================");
      }

      if (connection === "close") {

        const reason =
          new Boom(lastDisconnect?.error)
            ?.output?.statusCode;

        console.log(
          "❌ Connection Closed:",
          reason
        );

        if (
          reason !== DisconnectReason.loggedOut
        ) {

          console.log(
            "🔄 Reconnecting..."
          );

          setTimeout(() => {
            startBot();
          }, 5000);
        }
      }
    }
  );

  // ==========================================
  // SAVE CREDS
  // ==========================================
  sock.ev.on("creds.update", saveCreds);

  // ==========================================
  // MESSAGE EVENT
  // ==========================================
  sock.ev.on(
    "messages.upsert",
    async (m) => {
      await commandProcessor(sock, m);
    }
  );
}

// ==========================================
// START
// ==========================================
startBot();
