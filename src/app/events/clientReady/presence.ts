import type { Client, EventHandler } from 'commandkit';
import {
  ActivityType,
  Events,
  type GuildMember,
  type Presence,
} from 'discord.js';
import { RowDataPacket } from 'mysql2/promise';
import { STREAMER_ROLE_ID, STREAM_URLS } from '../../../config/streaming';
import db from '../../../utils/db';

interface LiveStats extends RowDataPacket {
  police_count: number;
  civ_count: number;
  total_players: number;
  EMS: number;
  fire: number;
}

const INTERVAL_MS = 5 * 60 * 1000;

type Status = { name: string; type: ActivityType };

interface LiveStreamer {
  name: string;
  url: string;
}

interface PresenceState {
  index: number;
  pool: Status[];
  liveStreamers: Map<string, LiveStreamer>;
  appliedActivity: string | null;
}

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

function getPlatform(url: string) {
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl.includes('twitch.tv')) return 'Twitch';
  if (normalizedUrl.includes('kick.com')) return 'Kick';
  if (
    normalizedUrl.includes('youtube.com') ||
    normalizedUrl.includes('youtu.be')
  )
    return 'YouTube';

  return 'stream';
}

function getSelectedStreamer(state: PresenceState) {
  for (const memberId of Object.keys(STREAM_URLS)) {
    const streamer = state.liveStreamers.get(memberId);
    if (streamer) return streamer;
  }

  return state.liveStreamers.values().next().value as LiveStreamer | undefined;
}

function setActivity(
  client: Client,
  state: PresenceState,
  activity: { name: string; type: ActivityType; url?: string },
) {
  const activityKey = `${activity.type}:${activity.name}:${activity.url ?? ''}`;
  if (state.appliedActivity === activityKey) return;

  client.user?.setActivity(activity);
  state.appliedActivity = activityKey;
}

function applyCurrentActivity(client: Client, state: PresenceState) {
  const streamer = getSelectedStreamer(state);

  if (streamer) {
    setActivity(client, state, {
      name: `🔴 ${streamer.name} on ${getPlatform(streamer.url)}`,
      type: ActivityType.Streaming,
      url: streamer.url,
    });
    return;
  }

  const status = state.pool[state.index % state.pool.length];
  state.index++;
  setActivity(client, state, status);
}

function updateStreamer(member: GuildMember, presence: Presence | null) {
  if (!member.roles.cache.has(STREAMER_ROLE_ID)) return null;

  const streamingActivity = presence?.activities.find(
    (activity) => activity.type === ActivityType.Streaming,
  );
  if (!streamingActivity) return null;

  const url = STREAM_URLS[member.id] ?? streamingActivity.url;
  if (!url) return null;

  return {
    name: member.displayName,
    url,
  } satisfies LiveStreamer;
}

function syncStreamer(
  client: Client,
  state: PresenceState,
  member: GuildMember,
  presence: Presence | null,
) {
  const streamer = updateStreamer(member, presence);
  const currentStreamer = state.liveStreamers.get(member.id);

  if (
    currentStreamer?.name === streamer?.name &&
    currentStreamer?.url === streamer?.url
  )
    return;

  if (!currentStreamer && !streamer) return;

  if (streamer) state.liveStreamers.set(member.id, streamer);
  else state.liveStreamers.delete(member.id);

  applyCurrentActivity(client, state);
}

function loadCachedStreamers(client: Client, state: PresenceState) {
  for (const guild of client.guilds.cache.values()) {
    for (const member of guild.members.cache.values()) {
      const streamer = updateStreamer(member, member.presence);
      if (streamer) state.liveStreamers.set(member.id, streamer);
    }
  }
}

async function rotateStatus(client: Client, state: PresenceState) {
  try {
    const [results] = await db.query<LiveStats[]>(
      'SELECT police_count, civ_count, total_players, EMS, fire FROM liveserverstats',
    );

    if (results.length) state.pool = buildStatusPool(results[0]);
  } catch {
    state.pool = [BRANDING];
  }

  applyCurrentActivity(client, state);
}

const handler: EventHandler<'clientReady'> = (client) => {
  console.log(`✅ ${client.user?.tag} is online.`);

  const state: PresenceState = {
    index: 0,
    pool: [BRANDING],
    liveStreamers: new Map(),
    appliedActivity: null,
  };

  loadCachedStreamers(client, state);

  client.on(Events.PresenceUpdate, (_oldPresence, newPresence) => {
    if (!newPresence.member) return;
    syncStreamer(client, state, newPresence.member, newPresence);
  });

  client.on(Events.GuildMemberUpdate, (_oldMember, newMember) => {
    syncStreamer(client, state, newMember, newMember.presence);
  });

  client.on(Events.GuildMemberRemove, (member) => {
    if (!state.liveStreamers.delete(member.id)) return;
    applyCurrentActivity(client, state);
  });

  void rotateStatus(client, state);
  setInterval(() => void rotateStatus(client, state), INTERVAL_MS);
};

export default handler;
