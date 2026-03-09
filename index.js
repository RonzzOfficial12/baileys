const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

const startBaileys = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, code } = update;
    if (code) {
      console.log('Kode pairing:', code);
    }
    if (connection === 'open') {
      console.log('Terhubung ke WhatsApp');
      // Auto join saluran
      const groupId = 'YOUR_GROUP_ID';
      await sock.groupJoin(groupId);
      console.log('Bergabung dengan saluran', groupId);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    console.log('Pesan masuk:', msg);
  });
};

startBaileys();
