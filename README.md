<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>NOX SPARROW MD</title>

<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<style>

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:'Poppins',sans-serif;
}

body{
    background:#05070d;
    color:white;
    overflow-x:hidden;
}

.container{
    width:100%;
    max-width:1100px;
    margin:auto;
    padding:20px;
}

/* HEADER */

.header{
    background:linear-gradient(135deg,#5b0eff,#8c2fff);
    border-radius:20px;
    padding:50px 20px;
    text-align:center;
    position:relative;
    overflow:hidden;
    box-shadow:0 0 35px rgba(128,0,255,0.4);
}

.header::before{
    content:'';
    position:absolute;
    width:300px;
    height:300px;
    background:rgba(255,255,255,0.08);
    border-radius:50%;
    top:-100px;
    right:-100px;
}

.header h1{
    font-size:65px;
    font-weight:800;
    letter-spacing:2px;
}

.header p{
    margin-top:10px;
    opacity:0.9;
    font-size:17px;
}

.powered{
    margin-top:8px;
    font-size:14px;
    opacity:0.8;
}

/* BADGES */

.badges{
    margin-top:30px;
}

.badge{
    display:inline-block;
    background:#0f172a;
    border:1px solid #9333ea;
    padding:10px 18px;
    margin:6px;
    border-radius:10px;
    font-size:13px;
    transition:0.3s;
}

.badge:hover{
    transform:scale(1.05);
    background:#1e293b;
}

/* SECTION */

.section{
    margin-top:35px;
    background:#0b1220;
    border:1px solid #1e293b;
    border-radius:20px;
    padding:30px;
}

.section-title{
    font-size:28px;
    color:#c084fc;
    margin-bottom:25px;
    font-weight:700;
}

/* FEATURES */

.grid{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
    gap:18px;
}

.card{
    background:#111827;
    border:1px solid #7e22ce;
    border-radius:18px;
    padding:22px;
    transition:0.3s;
}

.card:hover{
    transform:translateY(-6px);
    box-shadow:0 0 20px rgba(168,85,247,0.3);
}

.card h3{
    margin-bottom:10px;
    color:#d8b4fe;
}

/* BUTTONS */

.buttons{
    margin-top:30px;
}

.btn{
    display:inline-block;
    text-decoration:none;
    background:linear-gradient(135deg,#9333ea,#6d28d9);
    color:white;
    padding:14px 26px;
    border-radius:14px;
    margin:8px;
    font-weight:600;
    transition:0.3s;
}

.btn:hover{
    transform:translateY(-3px);
    box-shadow:0 0 18px rgba(147,51,234,0.4);
}

/* CODE */

pre{
    background:#020617;
    border:1px solid #1e293b;
    padding:20px;
    border-radius:15px;
    overflow:auto;
    color:#22c55e;
    line-height:1.7;
    margin-top:15px;
}

/* DEPLOY BOX */

.deploy-box{
    display:flex;
    flex-wrap:wrap;
    gap:15px;
}

.deploy{
    flex:1;
    min-width:180px;
    background:#111827;
    border:1px solid #9333ea;
    padding:20px;
    border-radius:15px;
    text-align:center;
    transition:0.3s;
}

.deploy:hover{
    transform:scale(1.03);
}

/* FOOTER */

.footer{
    margin-top:40px;
    text-align:center;
    opacity:0.7;
    padding-bottom:40px;
}

.footer h2{
    color:#d8b4fe;
    margin-bottom:10px;
}

</style>
</head>

<body>

<div class="container">

    <!-- HEADER -->

    <div class="header">

        <h1>NOX SPARROW</h1>

        <p>
            Built on Baileys • Designed for Speed • Enhanced for Stability
        </p>

        <div class="powered">
            Powered By NOX TECH
        </div>

        <div class="badges">

            <span class="badge">⚡ FAST</span>
            <span class="badge">🛡 STABLE</span>
            <span class="badge">📱 MULTI DEVICE</span>
            <span class="badge">🚀 NODE.JS</span>
            <span class="badge">💜 LATEST</span>

        </div>

        <div class="buttons">

            <a href="https://github.com/YOUR_USERNAME" class="btn">
                🍴 FORK REPOSITORY
            </a>

            <a href="#" class="btn">
                🔑 GET SESSION ID
            </a>

        </div>

    </div>

    <!-- FEATURES -->

    <div class="section">

        <div class="section-title">
            ✨ BOT FEATURES
        </div>

        <div class="grid">

            <div class="card">
                <h3>📱 Multi Device</h3>
                <p>Supports latest WhatsApp multi device system.</p>
            </div>

            <div class="card">
                <h3>⚡ Fast Performance</h3>
                <p>Optimized for high speed and low lag.</p>
            </div>

            <div class="card">
                <h3>🛡 Security</h3>
                <p>Advanced anti crash and anti spam protections.</p>
            </div>

            <div class="card">
                <h3>🤖 AI Features</h3>
                <p>Smart AI commands with modern responses.</p>
            </div>

            <div class="card">
                <h3>👥 Group Tools</h3>
                <p>Powerful admin and moderation commands.</p>
            </div>

            <div class="card">
                <h3>⬇ Downloader</h3>
                <p>Download videos, music and media easily.</p>
            </div>

        </div>

    </div>

    <!-- INSTALL -->

    <div class="section">

        <div class="section-title">
            🚀 DEPLOYMENT STEPS
        </div>

<pre>
1. Fork this repository

2. Clone repository

git clone https://github.com/YOUR_USERNAME/nox-sparrow-md

3. Install dependencies

npm install

4. Start bot

npm start
</pre>

    </div>

    <!-- ENV -->

    <div class="section">

        <div class="section-title">
            🔑 ENVIRONMENT VARIABLES
        </div>

<pre>
OWNER_NAME=NOX SPARROW
OWNER_NUMBER=256700000000
BOT_NAME=NOX-SPARROW-MD
PREFIX=.
SESSION_ID=PASTE_YOUR_SESSION
</pre>

    </div>

    <!-- DEPLOY -->

    <div class="section">

        <div class="section-title">
            🌐 DEPLOYMENT SITES
        </div>

        <div class="deploy-box">

            <div class="deploy">
                <h3>🟣 HEROKU</h3>
            </div>

            <div class="deploy">
                <h3>⚫ RENDER</h3>
            </div>

            <div class="deploy">
                <h3>🟠 RAILWAY</h3>
            </div>

            <div class="deploy">
                <h3>🔵 REPLIT</h3>
            </div>

        </div>

    </div>

    <!-- STRUCTURE -->

    <div class="section">

        <div class="section-title">
            📂 PROJECT STRUCTURE
        </div>

<pre>
📦 NOX-SPARROW-MD
 ┣ 📂 commands
 ┣ 📂 events
 ┣ 📂 lib
 ┣ 📂 database
 ┣ 📂 session
 ┣ 📜 index.js
 ┣ 📜 settings.js
 ┣ 📜 package.json
 ┗ 📜 README.md
</pre>

    </div>

    <!-- DISCLAIMER -->

    <div class="section">

        <div class="section-title">
            ⚠ DISCLAIMER
        </div>

        <p>
            This bot is created for educational purposes only.
            The developer is not responsible for misuse or bans.
        </p>

    </div>

    <!-- FOOTER -->

    <div class="footer">

        <h2>💜 NOX SPARROW MD 💜</h2>

        <p>
            Powered By NOX  STAR TECH
        </p>

    </div>

</div>

</body>
</html>
