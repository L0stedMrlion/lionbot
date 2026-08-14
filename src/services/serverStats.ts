import type { Client } from 'discord.js';
import { RowDataPacket } from 'mysql2/promise';
import db from '../utils/db';

const CHANNEL_IDS = {
  stats: '1429495007584194704',
  online: '1429495249855840538',
  duty_times: '1460019305448996894',
  ems_fd: '1493138137575325787',
};

const STATS_CATEGORY_ID = '1429494745960284240';

function getPragueTime(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Prague',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());
}

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

async function updateServerStats(client: Client) {
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
        `👮 Police: ${police_count} | 🟩 Verf. Civs: ${civ_count}`,
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

    const statsCategory = client.channels.cache.get(STATS_CATEGORY_ID);
    if (statsCategory && 'setName' in statsCategory) {
      const timestamp = getPragueTime();
      await statsCategory.setName(
        `📊┃Server Live Stats (LAST UPD: ${timestamp})`,
      );
      console.log(`✅ Updated stats category timestamp: ${timestamp}`);
    } else {
      console.error('❌ Stats category not found or cannot be renamed');
    }
  } catch (err) {
    console.error('❌ Error updating server stats:', err);
  }
}

async function updateDutyTimeStats(client: Client) {
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

export function initializeServerStats(client: Client) {
  client.once('clientReady', () => {
    console.log('🤖 Bot is ready, updating stats...');
    updateServerStats(client);
    updateDutyTimeStats(client);
  });

  setInterval(() => updateServerStats(client), 330000);
  setInterval(() => updateDutyTimeStats(client), 1200000);
}
