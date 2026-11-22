import axios from 'axios';
import { MessageFlags, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, ThumbnailBuilder } from 'discord.js';
import type { Client, GuildMember, User } from 'discord.js';
import { claimCivRoleGroups } from '../config/claimciv';

type SyncResult = {
  status: string;
  group: string;
  changed: boolean;
  affected: number;
  skipped: number;
  linked: number;
  pending: boolean;
};

type SyncTarget = {
  group: string;
  label: string;
};

export const civSyncGuildId = process.env.CIVSYNC_GUILD_ID || '1286329202723000431';

function resolveCivGroup(roleIds: { has(roleId: string): boolean }): SyncTarget {
  const matched = claimCivRoleGroups.find(({ roleId }) => roleIds.has(roleId));
  const group = matched?.group ?? 'user';
  const labels: Record<string, string> = { user: 'User', civ: 'Civilian', civ_exp: 'Experienced Civilian', civ_beg: 'Beginner Civilian' };
  return { group, label: labels[group] ?? group };
}

const pending = new Map<string, Promise<SyncResult>>();
const knownLinked = new Set<string>();
let started = false;
let running = false;
let lastFullScan = 0;

function apiUrl(path: string) {
  const host = process.env.IP || 'localhost';
  const port = process.env.GAMESERVER_PORT || '30120';
  const resource = process.env.GAMESERVER_CIVSYNC_RESOURCE || 'lion_civsync';
  if (!/^[\w-]+$/.test(resource)) throw new Error('Invalid GAMESERVER_CIVSYNC_RESOURCE');
  return `http://${host}:${port}/${resource}${path}`;
}

function authorization() {
  const key = process.env.GAMESERVER_CIVSYNC_API_KEY;
  if (!key || key.length < 24) throw new Error('Missing or too short GAMESERVER_CIVSYNC_API_KEY');
  return { 'X-Lion-Civsync-Key': key };
}

async function requestSync(discordId: string, target: SyncTarget): Promise<SyncResult> {
  const response = await axios.post<SyncResult>(
    apiUrl('/sync'),
    { discordId, group: target.group },
    { headers: authorization(), timeout: 10000 },
  );
  if (response.data.status !== 'ok') throw new Error('Invalid FiveM synchronization response');
  return response.data;
}

async function notifyUser(user: User, target: SyncTarget, result: SyncResult) {
  if (!result.changed && result.affected === 0) return;

  const revoked = target.group === 'user';
  const heading = revoked ? '❌ Civilian oprávnění odebrána' : '✅ Civilian oprávnění aktualizována';
  const message = revoked
    ? 'Tvoje oprávnění v systému Civilian byla odebrána. Příslušné postavy byly převedeny zpět do základní skupiny \u0060user\u0060.'
    : `Tvoje aktuální skupina je **${target.label}** (\u0060${target.group}\u0060). Oprávnění se automaticky synchronizují na všechny tvoje příslušné postavy.`;

  const details: string[] = [];
  if (result.pending) {
    details.push('⏳ **Čeká na propojení účtu**\nZměny se uplatní po propojení FiveM účtu s Discordem při připojení na server.');
  }

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 🌀 LION POLICE ROLEPLAY\n## Civilian Permissions'),
      new TextDisplayBuilder().setContent(`### ${heading}\n\n${message}`),
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder({
        media: { url: 'https://r2.fivemanage.com/zlqBQerSIEakQVh7POEZe/policelogo.png' },
      }),
    );

  const components = [
    section,
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    ...(details.length ? [new TextDisplayBuilder().setContent(details.join('\n\n')), new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)] : []),
    new TextDisplayBuilder().setContent('ℹ️ **Automatické oznámení:** Tato zpráva byla vygenerována automaticky pouze pro Vaši informaci.'),
  ];

  try {
    await user.send({ flags: MessageFlags.IsComponentsV2, components });
  } catch (error) {
    console.warn(`[civSync] Discord DM not delivered to ${user.id}:`, error);
  }
}

function serializeSync(discordId: string, task: () => Promise<SyncResult>) {
  const previous = pending.get(discordId);
  const current = (previous ? previous.catch(() => undefined) : Promise.resolve()).then(task);
  pending.set(discordId, current);
  void current.then(
    () => { if (pending.get(discordId) === current) pending.delete(discordId); },
    () => { if (pending.get(discordId) === current) pending.delete(discordId); },
  );
  return current;
}

async function performSync(discordId: string, target: SyncTarget, user?: User, sendDm = true) {
  const result = await requestSync(discordId, target);
  if (sendDm && user) await notifyUser(user, target, result);
  return result;
}

export function syncMember(member: GuildMember, sendDm = true) {
  return serializeSync(member.id, async () => {
    try {
      const actual = await member.guild.members.fetch({ user: member.id, force: true });
      const target = resolveCivGroup(actual.roles.cache);
      const result = await performSync(actual.id, target, actual.user, sendDm);
      knownLinked.add(member.id);
      return result;
    } catch (error) {
      knownLinked.delete(member.id);
      throw error;
    }
  });
}

export function syncRemovedMember(discordId: string, user: User) {
  return serializeSync(discordId, async () => {
    try {
      const target = { group: 'user', label: 'User' };
      const result = await performSync(discordId, target, user, true);
      knownLinked.add(discordId);
      return result;
    } catch (error) {
      knownLinked.delete(discordId);
      throw error;
    }
  });
}

async function checkLinked(client: Client) {
  if (running) return;
  running = true;
  try {
    const guild = await client.guilds.fetch(civSyncGuildId);
    const response = await axios.get<{ linked: string[] }>(apiUrl('/linked'), {
      headers: authorization(),
      timeout: 15000,
    });
    if (!Array.isArray(response.data.linked)) throw new Error('Invalid linked users response');
    const fullScan = lastFullScan === 0 || Date.now() - lastFullScan > 30 * 60 * 1000;
    const ids = response.data.linked.filter((id) =>
      /^\d{16,22}$/.test(id) && (fullScan || !knownLinked.has(id)),
    );
    for (let i = 0; i < ids.length; i += 4) {
      const batch = ids.slice(i, i + 4);
      await Promise.all(batch.map(async (id) => {
        try {
          const member = await guild.members.fetch({ user: id, force: true });
          await syncMember(member, true);
          knownLinked.add(id);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.warn(`[civSync] Invalid endpoint while reconciling ${id}`);
            return;
          }
          const code = (error as { code?: number | string })?.code;
          if (Number(code) === 10007 || Number(code) === 10013) {
            const user = await client.users.fetch(id).catch(() => undefined);
            await serializeSync(id, () => performSync(id, { group: 'user', label: 'User' }, user, true));
            knownLinked.add(id);
            return;
          }
          console.error(`[civSync] Reconciliation failed for ${id}:`, error);
        }
      }));
    }
    if (fullScan) lastFullScan = Date.now();
  } catch (error) {
    console.error('[civSync] Failed to reconcile Discord roles:', error);
  } finally {
    running = false;
  }
}

export function startCivSync(client: Client) {
  if (started) return;
  started = true;
  void checkLinked(client);
  setInterval(() => void checkLinked(client), 60 * 1000);
}
