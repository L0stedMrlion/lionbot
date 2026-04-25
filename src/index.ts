import 'dotenv/config';
import { Client, IntentsBitField } from 'discord.js';
import { CommandKit } from 'commandkit';
import path from 'path';
import mysql, { RowDataPacket } from 'mysql2/promise';

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
    console.log('🔄 Attempting to connect to MySQL...');
    console.log(`   Host: ${process.env.IP || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '3306'}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);

    await db.query('SELECT 1');
    console.log('✅ Connected to MySQL');
  } catch (err: any) {
    console.error('❌ MySQL Connection Failed:', err);
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Verify the database server is running');
    console.error('   2. Check if the IP/host is correct in your .env file');
    console.error(
      '   3. Ensure port 3306 (or your custom port) is not blocked by firewall',
    );
    console.error('   4. Verify database credentials are correct');
    console.error(
      '   5. If using a remote database, check network connectivity',
    );
    console.error('');
    console.error(
      '⚠️  Bot will continue running, but database features will not work.',
    );
  }
})();

const CHANNEL_IDS = {
  stats: '1429495007584194704',
  online: '1429495249855840538',
  duty_times: '1460019305448996894',
  ems_fd: '1493138137575325787',
};

interface ServerStats extends RowDataPacket {
  police_count: number;
  civ_count: number;
  total_players: number;
  EMS: number;
  fire: number;
}

interface DutyTimeStats extends RowDataPacket {
  total_seconds: number;
}

async function updateServerStats() {
  try {
    const [results] = await db.query<ServerStats[]>(
      'SELECT police_count, civ_count, total_players, EMS, fire FROM liveserverstats',
    );
    if (!results.length) {
      console.log('⚠️ No stats found in database');
      return;
    }

    const { police_count, civ_count, total_players, EMS, fire } = results[0];

    const statsChannel = client.channels.cache.get(CHANNEL_IDS.stats);
    if (statsChannel && 'setName' in statsChannel) {
      await statsChannel.setName(
        `👮 Police: ${police_count} | 🟩 Civs: ${civ_count}`,
      );
      console.log(
        `✅ Updated stats channel: Police: ${police_count}, Civs: ${civ_count}`,
      );
    } else {
      console.error('❌ Stats channel not found or cannot be renamed');
    }

    const onlineChannel = client.channels.cache.get(CHANNEL_IDS.online);
    if (onlineChannel && 'setName' in onlineChannel) {
      await onlineChannel.setName(`👥 Players Online: ${total_players}/32`);
      console.log(`✅ Updated online channel: ${total_players} players`);
    } else {
      console.error('❌ Online channel not found or cannot be renamed');
    }

    const emsFdChannel = client.channels.cache.get(CHANNEL_IDS.ems_fd);
    if (emsFdChannel && 'setName' in emsFdChannel) {
      await emsFdChannel.setName(`🚑 EMS: ${EMS || 0} | 🚒 FD: ${fire || 0}`);
      console.log(
        `✅ Updated EMS/FD channel: EMS: ${EMS || 0}, FD: ${fire || 0}`,
      );
    } else {
      console.error('❌ EMS/FD channel not found or cannot be renamed');
    }
  } catch (err) {
    console.error('❌ Error updating server stats:', err);
  }
}

async function updateDutyTimeStats() {
  try {
    const [results] = await db.query<DutyTimeStats[]>(
      'SELECT SUM(total_seconds) as total_seconds FROM duty_times',
    );

    if (!results.length || results[0].total_seconds === null) {
      console.log('⚠️ No duty times found in database');
      return;
    }

    const { total_seconds } = results[0];
    const total_hours = Math.round(total_seconds / 3600);

    const dutyChannel = client.channels.cache.get(CHANNEL_IDS.duty_times);
    if (dutyChannel && 'setName' in dutyChannel) {
      await dutyChannel.setName(`🚓 Total Duty Hours: ${total_hours}h`);
      console.log(`✅ Updated duty channel: ${total_hours}h`);
    } else {
      console.error('❌ Duty channel not found or cannot be renamed');
    }
  } catch (err) {
    console.error('❌ Error updating duty stats:', err);
  }
}

client.once('clientReady', () => {
  console.log('🤖 Bot is ready, updating stats...');
  updateServerStats();
  updateDutyTimeStats();
});

setInterval(updateServerStats, 330000);
setInterval(updateDutyTimeStats, 1200000);

new CommandKit({
  client,
  commandsPath: path.join(__dirname, 'commands'),
  eventsPath: path.join(__dirname, 'events'),
  devGuildIds: [],
  devUserIds: ['710549603216261141'],
  skipBuiltInValidations: true,
  bulkRegister: true,
});

client
  .login(process.env.TOKEN)
  .then(() => {
    console.log('✅ Discord bot logged in');
  })
  .catch((err) => {
    console.error('❌ Discord login failed:', err);
  });
