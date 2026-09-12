<div align="center">

<img src="assets/nox-sparrow-banner.png" alt="NOX SPARROW BOT Banner" width="100%">

<br>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=800&size=23&duration=2800&pause=900&color=8B5CF6&center=true&vCenter=true&width=760&lines=NOX+SPARROW+BOT;WHATSAPP+MULTI-DEVICE+AUTOMATION;FAST+%E2%80%A2+SMART+%E2%80%A2+POWERFUL;POWERED+BY+NOX+STAR.B" alt="Animated NOX SPARROW text">

<br><br>

<a href="https://noxsparrowbot.onrender.com">
<img src="https://img.shields.io/website?url=https%3A%2F%2Fnoxsparrowbot.onrender.com&style=for-the-badge&label=LIVE%20BOT&up_message=ONLINE&down_message=OFFLINE" alt="Live Bot Status">
</a>
<a href="https://github.com/deejaynoxofficial-droid/N-X-BOT">
<img src="https://img.shields.io/github/stars/deejaynoxofficial-droid/N-X-BOT?style=for-the-badge&logo=github&label=STARS" alt="GitHub Stars">
</a>
<a href="https://github.com/deejaynoxofficial-droid/N-X-BOT">
<img src="https://img.shields.io/github/last-commit/deejaynoxofficial-droid/N-X-BOT?style=for-the-badge&logo=git&label=UPDATED" alt="Last Commit">
</a>

<br>

<a href="https://github.com/deejaynoxofficial-droid/N-X-BOT/fork">
<img src="https://img.shields.io/badge/FORK-REPOSITORY-7C3AED?style=for-the-badge&logo=github" alt="Fork">
</a>
<a href="https://render.com/deploy?repo=https://github.com/deejaynoxofficial-droid/N-X-BOT">
<img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render">
</a>

<br><br>

> ⚡ **More than a bot — a complete WhatsApp automation experience.**

</div>

---

## 🕶️ `SYSTEM // OVERVIEW`

**NOX SPARROW BOT** is a modern **WhatsApp Multi-Device bot** built with **Node.js + Baileys**.

Designed around a modular command architecture, persistent sessions, web pairing, API integrations and multi-user support, NOX SPARROW is built to be **fast, expandable and easy to maintain**.

```text
╭──────────────────────────────────────────────────────────╮
│                    NOX SPARROW BOT                       │
│                                                          │
│  ⚡ FAST        🔐 MULTI-USER        🌐 WEB PAIRING      │
│  🤖 AI          📥 DOWNLOADS         👥 GROUP TOOLS      │
│  🛠 TOOLS       🎮 FUN               📡 API POWER        │
╰──────────────────────────────────────────────────────────╯
```

---

## ⚡ `FEATURE MATRIX`

<table>
<tr>
<td align="center" width="25%">

### ⚡
**67+ COMMANDS**

Modular commands, aliases and categories.

</td>
<td align="center" width="25%">

### 🔐
**MULTI-USER**

Multiple WhatsApp accounts with persistent sessions.

</td>
<td align="center" width="25%">

### 🌐
**WEB PAIRING**

Fast pairing-code login from the browser.

</td>
<td align="center" width="25%">

### 🤖
**AI POWER**

AI integrations and intelligent utilities.

</td>
</tr>
<tr>
<td align="center" width="25%">

### 📥
**MEDIA TOOLS**

Download and process supported media.

</td>
<td align="center" width="25%">

### 👥
**GROUP TOOLS**

Administration and group utilities.

</td>
<td align="center" width="25%">

### 🔄
**AUTO RECONNECT**

Connection recovery and session restoration.

</td>
<td align="center" width="25%">

### 🧩
**MODULAR**

Add commands without bloating `index.js`.

</td>
</tr>
</table>

---

## 📸 `SCREENSHOTS // PREVIEW`

> Add your real screenshots to `assets/screenshots/` and replace the filenames below.

<div align="center">

<table>
<tr>
<td><img src="assets/screenshots/menu.png" alt="NOX SPARROW Menu" width="300"></td>
<td><img src="assets/screenshots/pairing.png" alt="Web Pairing" width="300"></td>
</tr>
<tr>
<td align="center"><b>⚡ Main Menu</b></td>
<td align="center"><b>🌐 Web Pairing</b></td>
</tr>
<tr>
<td><img src="assets/screenshots/ai.png" alt="AI Command" width="300"></td>
<td><img src="assets/screenshots/group.png" alt="Group Tools" width="300"></td>
</tr>
<tr>
<td align="center"><b>🤖 AI Tools</b></td>
<td align="center"><b>👥 Group Tools</b></td>
</tr>
</table>

</div>

---

## 🧬 `COMMAND SYSTEM`

| Module | Examples |
|---|---|
| 🏠 **Main** | `.menu` `.help` `.ping` `.channel` |
| 👥 **Group** | Group management and moderation |
| 🎮 **Fun** | Entertainment commands |
| 🤖 **AI** | `.ai` and AI-powered tools |
| 🛠️ **Tools** | Utilities and converters |
| 📥 **Download** | `.play` `.song` `.ytmp3` `.ytmp4` |
| 👑 **Owner** | Owner/admin controls |

### Example terminal

```text
┌──[ NOX-SPARROW ]──[ COMMAND ]
│
├─ .menu
├─ .ai hello
├─ .play song name
├─ .tiktok url
├─ .instagram url
├─ .weather Kampala
└─ .sticker
```

> The exact command list is determined by the files currently installed in `commands/`.

---

## 🧠 `ARCHITECTURE // CORE`

```text
                         ┌──────────────────┐
                         │   WHATSAPP USER  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    BAILEYS MD    │
                         └────────┬─────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │      SOCKET MANAGER      │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      COMMAND HANDLER     │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
         ┌─────────┐        ┌─────────┐        ┌──────────┐
         │   AI    │        │ GROUPS  │        │ DOWNLOAD │
         └─────────┘        └─────────┘        └──────────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 ▼
                       ┌──────────────────┐
                       │ EXTERNAL APIS    │
                       └──────────────────┘
```

---

## 🚀 `QUICK START // LOCAL`

### 01 — Clone

```bash
git clone https://github.com/deejaynoxofficial-droid/N-X-BOT.git
cd N-X-BOT
```

### 02 — Install

```bash
npm install
```

### 03 — Environment

Create `.env`:

```env
PORT=3000

NEOXR_API_BASE=https://api.neoxr.my.id
API_KEY=YOUR_NEOXR_API_KEY

API_NINJAS_KEY=YOUR_API_NINJAS_KEY

OPENAI_KEY=
GEMINI_KEY=
```

### 04 — Launch

```bash
npm start
```

Development mode:

```bash
npm run dev
```

---

## ☁️ `DEPLOY // RENDER`

<div align="center">

### One-click deployment

<a href="https://render.com/deploy?repo=https://github.com/deejaynoxofficial-droid/N-X-BOT">
<img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render">
</a>

<br><br>

**Fork → Connect → Add Variables → Deploy → Pair**

</div>

### Required environment variables

| Variable | Value |
|---|---|
| `NEOXR_API_BASE` | `https://api.neoxr.my.id` |
| `API_KEY` | Your NeoXR API key |
| `API_NINJAS_KEY` | Your API Ninjas key |
| `PORT` | Render normally provides the port automatically |

> 🔒 Put secrets in **Render → Environment Variables**. Do not put them in source code.

---

## 📱 `PAIRING // WHATSAPP`

Live web interface:

**https://noxsparrowbot.onrender.com**

```text
1. Open the web pairing page
2. Enter your WhatsApp number
3. Request a pairing code
4. Open WhatsApp
5. Linked Devices
6. Link a Device
7. Enter the pairing code
8. Wait for connection
```

---

## 🔑 `API // CONFIGURATION`

### NeoXR

```env
NEOXR_API_BASE=https://api.neoxr.my.id
API_KEY=YOUR_NEOXR_API_KEY
```

### API Ninjas

```env
API_NINJAS_KEY=YOUR_API_NINJAS_KEY
```

**Never publish these values in GitHub.**

---

## 📂 `PROJECT // STRUCTURE`

```text
N-X-BOT/
│
├── commands/              # Modular bot commands
├── handler/               # Command/message handling
│   └── commandHandler.js
├── sockets/               # WhatsApp socket management
│   └── socketManager.js
├── public/                # Web pairing UI
├── database/              # Bot databases
├── sessions/              # WhatsApp auth sessions
├── media/                 # Bot media
├── temp/                  # Temporary files
├── logs/                  # Runtime logs
│
├── index.js               # Application entry
├── settings.js            # Configuration
├── package.json           # Dependencies/scripts
├── .env.example           # Environment template
└── README.md              # Documentation
```

---

## 🛡️ `SECURITY // PROTOCOL`

```text
[✓] Keep API keys private
[✓] Use environment variables
[✓] Keep sessions out of Git
[✓] Rotate exposed credentials
[✓] Keep dependencies updated
[✓] Monitor deployment logs
[✗] Never upload .env
[✗] Never share WhatsApp session files
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

## 🧑‍💻 `DEVELOPMENT // NEW COMMAND`

Create a file inside `commands/`:

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

## 🗺️ `ROADMAP // NEXT`

```text
[x] Multi-Device WhatsApp
[x] Pairing-code login
[x] Multi-user sessions
[x] Modular commands
[x] Web pairing
[x] API integrations
[x] Group utilities
[x] Download tools
[x] AI commands
[ ] Advanced live dashboard
[ ] Plugin marketplace
[ ] More AI providers
[ ] More automation
```

---

## 📡 `LIVE STATUS`

<div align="center">

**BOT:** `NOX SPARROW`  
**HOST:** `Render`  
**MODE:** `MULTI-USER`  
**WEB:** [noxsparrowbot.onrender.com](https://noxsparrowbot.onrender.com)

<br>

<img src="https://img.shields.io/website?url=https%3A%2F%2Fnoxsparrowbot.onrender.com&style=for-the-badge&label=NOX%20SPARROW&up_message=ONLINE%20%E2%9C%93&down_message=OFFLINE%20%E2%9C%97" alt="Live status">

</div>

---

## ⭐ `SUPPORT // PROJECT`

If NOX SPARROW is useful to you:

```text
⭐ STAR     → Show support
🍴 FORK     → Build your own version
🐛 REPORT   → Help find bugs
💡 CONTRIBUTE → Improve the project
📢 SHARE    → Tell other developers
```

---

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=800&size=21&duration=2600&pause=800&color=25D366&center=true&vCenter=true&width=650&lines=STAY+FAST.;STAY+SECURE.;STAY+NOX.;NOX+SPARROW+BOT+%E2%9A%A1" alt="Animated footer">

<br>

### ⚡ `NOX SPARROW BOT`

**Made with ❤️ by NOX STAR.B**

`© POWERED BY NOX STAR.B`

<br>

<a href="https://github.com/deejaynoxofficial-droid/N-X-BOT">GitHub</a>
&nbsp;•&nbsp;
<a href="https://noxsparrowbot.onrender.com">Web Pairing</a>
&nbsp;•&nbsp;
<a href="https://render.com/deploy?repo=https://github.com/deejaynoxofficial-droid/N-X-BOT">Deploy</a>

</div>
