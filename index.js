const baileys = require("@whiskeysockets/baileys")
const makeWASocket = baileys.default
const { useMultiFileAuthState, DisconnectReason } = baileys
const pino = require("pino")

async function startBot(){

const { state, saveCreds } = await useMultiFileAuthState("./session")

const sock = makeWASocket({
auth: state,
logger: pino({ level: "silent" })
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", async (update) => {

const { connection, lastDisconnect } = update

if(connection === "close"){

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

console.log("Connection closed")

if(shouldReconnect){
startBot()
}

}

if(connection === "open"){
console.log("✅ WhatsApp Connected")
}

})

/* pairing code */

if(!sock.authState.creds.registered){

const code = await sock.requestPairingCode("62XXXXXXXXXX")

console.log("Pairing Code:", code)

}

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]

if(!msg.message) return

console.log("Message from:", msg.key.remoteJid)

})

}

startBot()
