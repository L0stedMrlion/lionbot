import { Client } from 'discord.js';
import { RowDataPacket } from 'mysql2/promise';
import { db } from './database';
import { config } from '../config';

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

export async function updateServerStats(client: Client) {
  try {
    const [results] = await db.query<ServerStats[]>(
      'SELECT police_count, civ_count, total_players, EMS, fire FROM liveserverstats',
    );
    if (!results.length) {
      console.log('⚠️ No stats found in database');
      return;
    }

    const { police_count, civ_count, total_players, EMS, fire } = results[0];

    const statsChannel = client.channels.cache.get(
      config.discord.channels.stats,
    );
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

    const onlineChannel = client.channels.cache.get(
      config.discord.channels.online,
    );
    if (onlineChannel && 'setName' in onlineChannel) {
      await onlineChannel.setName(`👥 Players Online: ${total_players}/48`);
      console.log(`✅ Updated online channel: ${total_players} players`);
    } else {
      console.error('❌ Online channel not found or cannot be renamed');
    }

    const emsFdChannel = client.channels.cache.get(
      config.discord.channels.ems_fd,
    );
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

export async function updateDutyTimeStats(client: Client) {
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

    const dutyChannel = client.channels.cache.get(
      config.discord.channels.duty_times,
    );
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
