<div align="center">

<img src="assets/nox-sparrow-neon-banner.png" alt="NOX SPARROW neon banner" width="100%">

<br>

<img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=800&size=24&duration=2600&pause=800&color=8B5CF6&center=true&vCenter=true&width=780&lines=NOX+SPARROW+BOT;MODERN+WHATSAPP+MULTI-DEVICE+BOT;FAST+%E2%80%A2+SECURE+%E2%80%A2+POWERFUL;POWERED+BY+NOX+STAR.B" alt="Animated NOX SPARROW header">

<br><br>

<a href="https://noxsparrowbot.onrender.com">
<img src="https://img.shields.io/website?url=https%3A%2F%2Fnoxsparrowbot.onrender.com&style=for-the-badge&label=LIVE%20STATUS&up_message=ONLINE%20%E2%9C%93&down_message=OFFLINE%20%E2%9C%97" alt="Live bot status">
</a>
<a href="https://github.com/deejaynoxofficial-droid/N-X-BOT">
<img src="https://img.shields.io/github/stars/deejaynoxofficial-droid/N-X-BOT?style=for-the-badge&logo=github&label=STARS" alt="GitHub stars">
</a>
<a href="https://github.com/deejaynoxofficial-droid/N-X-BOT">
<img src="https://img.shields.io/github/license/deejaynoxofficial-droid/N-X-BOT?style=for-the-badge&label=LICENSE" alt="License">
</a>

<br><br>

<a href="https://render.com/deploy?repo=https://github.com/deejaynoxofficial-droid/N-X-BOT">
<img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render">
</a>

</div>

---

# 🦅 `NOX SPARROW // SYSTEM ONLINE`

> **NOX SPARROW BOT** is a modern, modular WhatsApp Multi-Device bot built with **Node.js** and **Baileys** — engineered for speed, stability, automation and expansion.

```text
╔══════════════════════════════════════════════════════════╗
║                 ⚡ NOX SPARROW BOT ⚡                    ║
║                                                          ║
║   FAST       SECURE       MULTI-USER       MODULAR       ║
║   AI         TOOLS        DOWNLOADS        GROUPS        ║
║   WEB        APIs         AUTOMATION       FUN            ║
╚══════════════════════════════════════════════════════════╝
```

---

## ⚡ `FEATURES // NEON CORE`

<table>
<tr>
<td align="center" width="25%">

### 🔥
**67+ COMMANDS**

Modular commands, aliases and categories.

</td>
<td align="center" width="25%">

### 👥
**MULTI-USER**

Support multiple WhatsApp sessions.

</td>
<td align="center" width="25%">

### 📡
**WEB PAIRING**

Pair accounts from the browser.

</td>
<td align="center" width="25%">

### 🤖
**AI**

AI-powered commands and integrations.

</td>
</tr>
<tr>
<td align="center">

### 📥
**DOWNLOAD**

Media downloading and processing.

</td>
<td align="center">

### 👑
**GROUP**

Administration and moderation tools.

</td>
<td align="center">

### 🔄
**RECONNECT**

Session restore and connection recovery.

</td>
<td align="center">

### 🧩
**MODULAR**

Easy command expansion.

</td>
</tr>
</table>

---

## 🟣 `COMMANDS // MATRIX`

| Category | Purpose |
|---|---|
| 🏠 **Main** | Core bot commands and information |
| 👥 **Group** | Group management and moderation |
| 🎮 **Fun** | Games, memes and entertainment |
| 🤖 **AI** | AI and intelligent utilities |
| 🛠️ **Tools** | Useful utilities |
| 📥 **Download** | Media and content tools |
| 👑 **Owner** | Owner and administration commands |

```text
┌─[ NOX-SPARROW ]─────────────────────────────┐
│ .menu                                       │
│ .help                                       │
│ .ping                                       │
│ .ai <message>                               │
│ .play <song>                                │
│ .song <artist - title>                      │
│ .tiktok <url>                               │
│ .instagram <url>                            │
│ .weather <city>                             │
│ .translate <text>                           │
└────────────────────────────────────────────┘
```

> The installed files inside `commands/` determine the exact command list.

---

## 🧬 `ARCHITECTURE // CORE`

```text
                         ┌─────────────────┐
                         │    WHATSAPP     │
                         │      USER       │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    BAILEYS MD   │
                         └────────┬────────┘
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │     SOCKET MANAGER     │
                     └────────────┬───────────┘
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │     COMMAND HANDLER    │
                     └────────────┬───────────┘
                                  │
               ┌──────────────────┼──────────────────┐
               ▼                  ▼                  ▼
          ┌──────────┐       ┌──────────┐       ┌──────────┐
          │    AI    │       │  GROUPS  │       │ DOWNLOAD │
          └────┬─────┘       └────┬─────┘       └────┬─────┘
               │                  │                  │
               └──────────────────┼──────────────────┘
                                  ▼
                       ┌────────────────────┐
                       │    EXTERNAL APIs   │
                       └────────────────────┘
```

---

## 🚀 `QUICK START // BOOT SEQUENCE`

### `01` — Clone

```bash
git clone https://github.com/deejaynoxofficial-droid/N-X-BOT.git
cd N-X-BOT
```

### `02` — Install

```bash
npm install
```

### `03` — Configure

Copy `.env.example` to `.env` and fill in your own credentials locally.

```env
PORT=3000
NEOXR_API_BASE=https://api.neoxr.my.id
API_KEY=YOUR_NEOXR_API_KEY
API_NINJAS_KEY=YOUR_API_NINJAS_KEY
OPENAI_KEY=
GEMINI_KEY=
```

### `04` — Launch

```bash
npm start
```

Development:

```bash
npm run dev
```

> 🔒 **No real secrets are included anywhere in this README.**

---

## ☁️ `DEPLOYMENT // RENDER`

<div align="center">

### ⚡ ONE-CLICK DEPLOY

<a href="https://render.com/deploy?repo=https://github.com/deejaynoxofficial-droid/N-X-BOT">
<img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render">
</a>

<br><br>

`FORK` → `CONNECT` → `ENVIRONMENT` → `DEPLOY`

</div>

### Render environment variables

Add your own secret values in **Render → Environment**:

```text
API_KEY            = <your private NeoXR key>
NEOXR_API_BASE     = https://api.neoxr.my.id
API_NINJAS_KEY     = <your private API Ninjas key>
OPENAI_KEY         = <your private key if used>
GEMINI_KEY         = <your private key if used>
```

The README deliberately uses placeholders only.

---

## 📱 `PAIRING // WEB`

Live pairing interface:

**https://noxsparrowbot.onrender.com**

```text
┌─────────────────────────────────────┐
│       NOX SPARROW // PAIRING        │
├─────────────────────────────────────┤
│  01  Open the web pairing page      │
│  02  Enter WhatsApp number          │
│  03  Request pairing code            │
│  04  Open WhatsApp → Linked Devices │
│  05  Link a Device                   │
│  06  Enter the pairing code          │
│  07  Wait for connection             │
└─────────────────────────────────────┘
```

---

## 📂 `PROJECT // STRUCTURE`

```text
N-X-BOT/
│
├── commands/              # Bot commands
├── handler/               # Command/message handling
│   └── commandHandler.js
├── sockets/               # WhatsApp sockets
│   └── socketManager.js
├── public/                # Web interface
├── database/              # Bot data
├── sessions/              # WhatsApp auth sessions
├── media/                 # Bot media
├── temp/                  # Temporary files
├── logs/                  # Runtime logs
│
├── index.js               # Main entry point
├── settings.js            # Configuration
├── package.json           # Dependencies
├── .env.example           # Safe environment template
└── README.md              # Documentation
```

---

## 🔑 `API // SAFE CONFIGURATION`

### NeoXR

```env
NEOXR_API_BASE=https://api.neoxr.my.id
API_KEY=YOUR_NEOXR_API_KEY
```

### API Ninjas

```env
API_NINJAS_KEY=YOUR_API_NINJAS_KEY
```

### Optional integrations

```env
OPENAI_KEY=YOUR_OPENAI_KEY
GEMINI_KEY=YOUR_GEMINI_KEY
```

**Never replace these placeholders with real keys inside `README.md`.**

---

## 🛡️ `SECURITY // PROTOCOL`

```text
[✓] Store secrets in environment variables
[✓] Keep .env out of Git
[✓] Keep sessions out of Git
[✓] Rotate exposed credentials immediately
[✓] Review deployment logs
[✓] Keep dependencies updated

[✗] Do not publish API keys
[✗] Do not publish session files
[✗] Do not paste credentials into README
```

Recommended `.gitignore`:

```gitignore
.env
.env.*
sessions/*
!sessions/.gitkeep
logs/*
temp/*
```

---

## 🧑‍💻 `DEVELOPMENT // ADD COMMAND`

Create a new file inside `commands/`:

```js
module.exports = {
    name: "hello",
    aliases: ["hi"],
    category: "main",

    async execute(sock, msg) {
        const from = msg.key.remoteJid;

        await sock.sendMessage(from, {
            text: "👋 Hello from NOX SPARROW!"
        });
    }
};
```

---

## 🌌 `ROADMAP // FUTURE`

```text
[x] WhatsApp Multi-Device
[x] Pairing-code login
[x] Multi-user sessions
[x] Modular commands
[x] Web pairing
[x] API integrations
[x] Group utilities
[x] Download tools
[x] AI commands

[ ] Advanced dashboard
[ ] More AI providers
[ ] Plugin ecosystem
[ ] Advanced automation
[ ] More media tools
```

---

## 📡 `LIVE // STATUS`

<div align="center">

<a href="https://noxsparrowbot.onrender.com">
<img src="https://img.shields.io/website?url=https%3A%2F%2Fnoxsparrowbot.onrender.com&style=for-the-badge&label=NOX%20SPARROW&up_message=ONLINE%20%E2%9C%93&down_message=OFFLINE%20%E2%9C%97" alt="NOX SPARROW live status">
</a>

<br><br>

`BOT` **NOX SPARROW**  
`MODE` **MULTI-USER**  
`HOST` **RENDER**  
`WEB` **PAIRING ENABLED**

</div>

---

## ⭐ `SUPPORT // COMMUNITY`

```text
⭐ STAR       → Support the project
🍴 FORK       → Create your own version
🐛 ISSUES     → Report bugs
💡 IDEAS      → Suggest improvements
🛠️ CODE       → Contribute
📢 SHARE      → Spread NOX SPARROW
```

---

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=800&size=21&duration=2400&pause=700&color=25D366&center=true&vCenter=true&width=650&lines=STAY+FAST.;STAY+SECURE.;STAY+NOX.;BUILDING+A+SMARTER+TOMORROW." alt="Animated footer">

<br><br>

# ⚡ `NOX SPARROW BOT`

**Made with ❤️ by NOX STAR.B**

`© POWERED BY NOX STAR.B`

<br>

<a href="https://github.com/deejaynoxofficial-droid/N-X-BOT">GitHub</a>
&nbsp; • &nbsp;
<a href="https://noxsparrowbot.onrender.com">Web Pairing</a>
&nbsp; • &nbsp;
<a href="https://render.com/deploy?repo=https://github.com/deejaynoxofficial-droid/N-X-BOT">Deploy to Render</a>

</div>
