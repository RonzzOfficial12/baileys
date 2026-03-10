const {
 default: makeWASocket,
 useMultiFileAuthState,
 DisconnectReason
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const readline = require("readline")

const rl = readline.createInterface({
 input: process.stdin,
 output: process.stdout
})

function question(q){
 return new Promise(resolve => rl.question(q, resolve))
}

/* AUTO JOIN CONFIG */

const autoJoinGroups = [
"INVITE_CODE_GROUP"
]

const autoJoinChannels = [
"120363390274692764@newsletter"
]

async function startBot(){

const { state, saveCreds } = await useMultiFileAuthState("./session")

const sock = makeWASocket({
 auth: state,
 logger: pino({ level: "silent" }),
 printQRInTerminal: false,
 markOnlineOnConnect: true
})

/* PAIRING LOGIN */

if(!sock.authState.creds.registered){

 const number = await question("Masukkan nomor WhatsApp (628xxx): ")

 const code = await sock.requestPairingCode(number)

 console.log("Pairing Code:", code)

}

/* CONNECTION */

sock.ev.on("connection.update", async(update)=>{

const { connection, lastDisconnect } = update

if(connection === "close"){

 const reason = lastDisconnect?.error?.output?.statusCode

 console.log("Connection Closed")

 if(reason !== DisconnectReason.loggedOut){
 startBot()
 }

}

if(connection === "open"){

 console.log("Bot Connected ✅")

/* AUTO JOIN GROUP */

for(let invite of autoJoinGroups){

 try{
 await sock.groupAcceptInvite(invite)
 console.log("Joined group")
 }catch(e){}
}

/* AUTO JOIN CHANNEL */

for(let ch of autoJoinChannels){

 try{
 await sock.newsletterFollow(ch)
 console.log("Joined channel")
 }catch(e){}
}

}

})

/* MESSAGE LISTENER */

sock.ev.on("messages.upsert", async({ messages })=>{

const msg = messages[0]
if(!msg.message) return
if(msg.key.remoteJid === "status@broadcast") return

const text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
""

console.log("Pesan masuk:", text)

})

sock.ev.on("creds.update", saveCreds)

}

startBot()
