const baileys = require("@whiskeysockets/baileys")
const makeWASocket = baileys.default
const { useMultiFileAuthState, DisconnectReason } = baileys
const pino = require("pino")
const readline = require("readline")

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})

async function startBot(){

const { state, saveCreds } = await useMultiFileAuthState("./session")

const sock = makeWASocket({
auth: state,
logger: pino({ level: "silent" })
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", async(update)=>{

const { connection, lastDisconnect } = update

if(connection === "close"){

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

console.log("Connection closed")

if(shouldReconnect) startBot()

}

if(connection === "open"){
console.log("✅ Bot Connected")
}

})

/* pairing lewat console */

if(!sock.authState.creds.registered){

rl.question("Masukkan nomor WhatsApp (contoh 628xxxx): ", async(number)=>{

const code = await sock.requestPairingCode(number)

console.log("Pairing Code:", code)

})

}

sock.ev.on("messages.upsert", ({ messages })=>{

const msg = messages[0]

if(!msg.message) return

console.log("Pesan dari:", msg.key.remoteJid)

})

}

startBot()
