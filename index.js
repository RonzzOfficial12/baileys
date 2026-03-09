const baileys = require("@whiskeysockets/baileys")
const makeWASocket = baileys.default
const { useMultiFileAuthState, DisconnectReason } = baileys
const pino = require("pino")

async function startBaileys() {

const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys")

const sock = makeWASocket({
logger: pino({ level: "silent" }),
auth: state
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", (update) => {
const { connection } = update

if (connection === "open") {
console.log("✅ WhatsApp Connected")
}

if (connection === "close") {
console.log("❌ Connection Closed")
startBaileys()
}

})

}

startBaileys()
