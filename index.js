const {
 default: makeWASocket,
 useMultiFileAuthState,
 DisconnectReason,
 fetchLatestWaWebVersion
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const chalk = require("chalk")
const readline = require("readline")
const { Boom } = require("@hapi/boom")

const rl = readline.createInterface({
 input: process.stdin,
 output: process.stdout
})

function question(text){
 return new Promise(resolve => rl.question(text, resolve))
}

async function startBot(){

const { version } = await fetchLatestWaWebVersion()

const { state, saveCreds } = await useMultiFileAuthState("./session")

const sock = makeWASocket({
 version,
 logger: pino({ level: "silent" }),
 auth: state,
 markOnlineOnConnect: true,
 printQRInTerminal: false
})

/* pairing code */

if(!sock.authState.creds.registered){

console.clear()

console.log(chalk.green("=== BAILEYS BOT ==="))

let number = await question("Enter WhatsApp Number (628xxx): ")
number = number.replace(/[^0-9]/g,"")

const code = await sock.requestPairingCode(number)

console.log(chalk.yellow("Pairing Code:"), code)

}

/* connection handler */

sock.ev.on("connection.update", async(update)=>{

const { connection, lastDisconnect } = update

if(connection === "close"){

const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

console.log(chalk.red("Connection closed:"), reason)

if(reason !== DisconnectReason.loggedOut){
console.log("Reconnecting...")
startBot()
}

}

if(connection === "open"){

console.log(chalk.green("Bot Connected ✅"))

try{

await sock.newsletterFollow("120363390274692764@newsletter")

console.log("Auto Join Channel Success")

}catch(err){

console.log("Channel join error")

}

}

})

/* message handler */

sock.ev.on("messages.upsert", async({ messages })=>{

try{

const msg = messages[0]

if(!msg.message) return
if(msg.key.remoteJid === "status@broadcast") return

const from = msg.key.remoteJid

const text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
""

console.log("Message:", text)

/* commands */

if(text === ".ping"){

await sock.sendMessage(from,{
text:"pong 🟢 bot active"
},{ quoted: msg })

}

if(text === ".menu"){

await sock.sendMessage(from,{
text:`BOT MENU

.ping
.menu

Bot Running ✅`
},{ quoted: msg })

}

}catch(err){
console.log("Message error:", err)
}

})

sock.ev.on("creds.update", saveCreds)

}

startBot()
