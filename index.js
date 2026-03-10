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

async function startBot(){

 const { state, saveCreds } = await useMultiFileAuthState("./session")

 const sock = makeWASocket({
  auth: state,
  logger: pino({ level: "silent" }),
  printQRInTerminal: false
 })

 if(!sock.authState.creds.registered){

  const number = await question("Masukkan nomor WA (628xxx): ")

  const code = await sock.requestPairingCode(number)

  console.log("Pairing Code:", code)

 }

 sock.ev.on("connection.update", (update)=>{

  const { connection, lastDisconnect } = update

  if(connection === "close"){

   const reason = lastDisconnect?.error?.output?.statusCode

   console.log("Connection closed:", reason)

   if(reason !== DisconnectReason.loggedOut){
    startBot()
   }

  }

  if(connection === "open"){
   console.log("Bot Connected ✅")
  }

 })

 sock.ev.on("messages.upsert", async ({ messages }) => {

  const msg = messages[0]
  if(!msg.message) return

  const text =
   msg.message.conversation ||
   msg.message.extendedTextMessage?.text ||
   ""

  console.log("Message:", text)

  if(text === ".ping"){
   await sock.sendMessage(msg.key.remoteJid,{ text: "pong 🟢" },{ quoted: msg })
  }

 })

 sock.ev.on("creds.update", saveCreds)

}

startBot()
