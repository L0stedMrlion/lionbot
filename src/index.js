require("dotenv").config();

const { Client, IntentsBitField } = require("discord.js");
const { CommandKit } = require("commandkit");
const path = require("path");
const mysql = require('mysql2/promise');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const db = mysql.createPool({
  host: process.env.IP,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

(async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("✅ Connected to MySQL");
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err);
  }
})();

const CHANNEL_IDS = {
  stats: '1429495007584194704',
  online: '1429495249855840538'
};

async function updateServerStats() {
  try {
    const [results] = await db.query('SELECT police_count, civ_count, total_players FROM liveserverstats');
    if (!results.length) {
      console.log("⚠️ No stats found in database");
      return;
    }

    const { police_count, civ_count, total_players } = results[0];

    const statsChannel = client.channels.cache.get(CHANNEL_IDS.stats);
    if (statsChannel) {
      await statsChannel.setName(`👮 Police: ${police_count} | 🟩 Civs: ${civ_count}`);
      console.log(`✅ Updated stats channel: Police: ${police_count}, Civs: ${civ_count}`);
    } else {
      console.error("❌ Stats channel not found");
    }

    const onlineChannel = client.channels.cache.get(CHANNEL_IDS.online);
    if (onlineChannel) {
      await onlineChannel.setName(`👥 Players Online: ${total_players}/32`);
      console.log(`✅ Updated online channel: ${total_players} players`);
    } else {
      console.error("❌ Online channel not found");
    }

  } catch (err) {
    console.error("❌ Error updating server stats:", err);
  }
}

client.once('ready', () => {
  console.log('🤖 Bot is ready, updating stats...');
  updateServerStats();
});

setInterval(updateServerStats, 330000);

new CommandKit({
  client,
  commandsPath: path.join(__dirname, "commands"),
  eventsPath: path.join(__dirname, "events"),
  devGuildIds: [],
  devUserIds: ["710549603216261141"],
  skipBuiltInValidations: true,
  bulkRegister: true,
});

client.login(process.env.TOKEN).then(() => {
  console.log("✅ Discord bot logged in");
}).catch(err => {
  console.error("❌ Discord login failed:", err);
});
