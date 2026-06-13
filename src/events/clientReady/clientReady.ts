import { ActivityType, Client } from 'discord.js';
import { RowDataPacket } from 'mysql2/promise';
import db from '../../utils/db';

export const once = false;
export const event = 'clientReady';

interface LiveStats extends RowDataPacket {
  police_count: number;
  civ_count: number;
  total_players: number;
  EMS: number;
  fire: number;
}

const INTERVAL_MS = 5 * 60 * 1000;

type Status = { name: string; type: ActivityType };

const BRANDING: Status = {
  name: '🦁 Lion Police Roleplay',
  type: ActivityType.Watching,
};

function buildStatusPool(stats: LiveStats): Status[] {
  const { police_count, civ_count, total_players, EMS, fire } = stats;

  const candidates: Status[] = [];

  if (total_players > 0)
    candidates.push({
      name: `👥 ${total_players}/32 players online`,
      type: ActivityType.Watching,
    });

  if (police_count > 0)
    candidates.push({
      name: `👮 ${police_count} police online`,
      type: ActivityType.Watching,
    });

  if (civ_count > 0)
    candidates.push({
      name: `🟩 ${civ_count} Verified Civilian${civ_count !== 1 ? 's' : ''} online`,
      type: ActivityType.Watching,
    });

  if (EMS > 0)
    candidates.push({
      name: `🚑 ${EMS} EMS online`,
      type: ActivityType.Watching,
    });

  if (fire > 0)
    candidates.push({
      name: `🚒 ${fire} FD online`,
      type: ActivityType.Watching,
    });

  if (candidates.length === 0) return [BRANDING];

  return [...candidates.slice(0, 2), BRANDING];
}

async function rotateStatus(
  client: Client,
  state: { index: number; pool: Status[] },
) {
  try {
    const [results] = await db.query<LiveStats[]>(
      'SELECT police_count, civ_count, total_players, EMS, fire FROM liveserverstats',
    );

    if (results.length) state.pool = buildStatusPool(results[0]);
  } catch {
    state.pool = [BRANDING];
  }

  const status = state.pool[state.index % state.pool.length];
  state.index++;

  client.user?.setActivity({ name: status.name, type: status.type });
}

export default function (client: Client) {
  console.log(`✅ ${client.user?.tag} is online.`);

  const state = { index: 0, pool: [BRANDING] };

  rotateStatus(client, state);
  setInterval(() => rotateStatus(client, state), INTERVAL_MS);
}
