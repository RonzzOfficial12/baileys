const baileys = require("@whiskeysockets/baileys")
const makeWASocket = baileys.default
const { useMultiFileAuthState, DisconnectReason } = baileys
const pino = require("pino")

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState("./session")

const sock = makeWASocket({
auth: state,
logger: pino({ level: "silent" })
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", async (update) => {

const { connection, lastDisconnect } = update

if (connection === "close") {

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

console.log("Koneksi terputus")

if (shouldReconnect) {
startBot()
}

}

if (connection === "open") {

console.log("✅ Bot Connected")

/* AUTO JOIN SALURAN */
try {

const channel = "120363xxxxxxxxx@newsletter"

await sock.newsletterFollow(channel)

console.log("Berhasil join saluran")

} catch {
console.log("Gagal join saluran")
}

/* AUTO JOIN GROUP */

try {

const invite = "XXXXXXX"

await sock.groupAcceptInvite(invite)

console.log("Berhasil join group")

} catch {
console.log("Gagal join group")
}

}

})

/* PAIRING CODE */

if (!sock.authState.creds.registered) {

const phone = "62xxxxxxxxxx"

const code = await sock.requestPairingCode(phone)

console.log("Pairing Code:", code)

}

/* PESAN MASUK */

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]

if (!msg.message) return

console.log("Pesan:", msg.key.remoteJid)

})

}

startBot()
