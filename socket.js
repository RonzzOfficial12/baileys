const baileys = require("@whiskeysockets/baileys")
const makeWASocket = baileys.default
const { useMultiFileAuthState, DisconnectReason } = baileys
const pino = require("pino")

const fs = require("fs")
const path = require("path")

const config = require("../config")
const logger = require("./logger")
const { getBody } = require("./utils")

async function startSock(){

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

logger.error("Connection closed")

if(shouldReconnect) startSock()

}

if(connection === "open"){

logger.success("WhatsApp Connected")

for(let ch of config.autoJoinChannels){

try{
await sock.newsletterFollow(ch)
logger.info("Joined channel "+ch)
}catch{}
}

for(let gc of config.autoJoinGroups){

try{
await sock.groupAcceptInvite(gc)
logger.info("Joined group "+gc)
}catch{}
}

}

})

/* pairing code */

if(!sock.authState.creds.registered){

const code = await sock.requestPairingCode(config.ownerNumber)

console.log("Pairing Code:", code)

}

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]

if(!msg.message) return

const body = getBody(msg)

if(!body.startsWith(config.prefix)) return

const command = body.slice(1).split(" ")[0]

const cmdPath = path.join(__dirname,"../commands",command+".js")

if(fs.existsSync(cmdPath)){

const cmd = require(cmdPath)

cmd(sock,msg)

}

})

}

module.exports = startSock
