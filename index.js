const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const pino = require("pino")

async function startBaileys() {

const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys")

const sock = makeWASocket({
logger: pino({ level: "silent" }),
auth: state,
printQRInTerminal: false
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", async (update) => {
const { connection, lastDisconnect } = update

if (connection === "close") {
const reason = lastDisconnect?.error?.output?.statusCode

if (reason !== DisconnectReason.loggedOut) {
console.log("Reconnect...")
startBaileys()
}

}

if (connection === "open") {
console.log("WhatsApp Connected")

/* AUTO JOIN SALURAN */
try {
const channelId = "120363XXXXXXXX@newsletter" // isi id saluran
await sock.newsletterFollow(channelId)
console.log("Berhasil join saluran:", channelId)
} catch (e) {
console.log("Gagal join saluran")
}

/* AUTO JOIN GROUP */
try {
const inviteCode = "XXXXXXX" // kode invite group
await sock.groupAcceptInvite(inviteCode)
console.log("Berhasil join group")
} catch (e) {
console.log("Gagal join group")
}

}

})

/* PAIRING CODE */
if (!sock.authState.creds.registered) {

const phoneNumber = "62XXXXXXXXXX"

const code = await sock.requestPairingCode(phoneNumber)

console.log("Pairing Code:", code)

}

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]
if (!msg.message) return

console.log("Pesan masuk:", msg)

})

}

startBaileys()
