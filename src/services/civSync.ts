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
  const labels: Record<string, string> = { user: 'User', civ_exp: 'Civilian Experienced', civ: 'Verified Civilian', civ_beg: 'Civilian Begginer' };
  return { group, label: labels[group] ?? group };
}

const pending = new Map<string, Promise<SyncResult>>();
const roleChangeTimers = new Map<string, ReturnType<typeof setTimeout>>();
const noCivRoleSince = new Map<string, number>();

function configuredDelay(name: string, defaultSeconds: number, minimumSeconds: number, maximumSeconds: number): number {
  const raw = process.env[name];
  if (!raw) return defaultSeconds * 1000;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < minimumSeconds || parsed > maximumSeconds) {
    console.warn(`[civSync] Invalid ${name}; using ${defaultSeconds} seconds`);
    return defaultSeconds * 1000;
  }
  return parsed * 1000;
}

const rankChangeDelayMs = configuredDelay('CIVSYNC_ROLE_SETTLE_SECONDS', 12, 5, 120);
const roleRemovalGraceMs = configuredDelay('CIVSYNC_REMOVAL_GRACE_SECONDS', 60, 30, 600);

function deferredSync(group: string): SyncResult {
  return { status: 'deferred', group, changed: false, affected: 0, skipped: 0, linked: 0, pending: true };
}

function scheduleRoleSyncTimer(member: GuildMember, delayMs: number) {
  const existing = roleChangeTimers.get(member.id);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    if (roleChangeTimers.get(member.id) !== timer) return;
    roleChangeTimers.delete(member.id);
    void syncMember(member).catch((error) => {
      console.error(`[civSync] Delayed role synchronization failed for ${member.id}:`, error);
    });
  }, Math.max(0, delayMs));
  roleChangeTimers.set(member.id, timer);
}

export function scheduleCivRoleSync(member: GuildMember) {
  const group = resolveCivGroup(member.roles.cache).group;
  if (group === 'user') {
    noCivRoleSince.set(member.id, Date.now());
  } else {
    noCivRoleSince.delete(member.id);
  }
  scheduleRoleSyncTimer(member, group === 'user' ? roleRemovalGraceMs : rankChangeDelayMs);
}

export function cancelCivRoleSync(discordId: string) {
  const existing = roleChangeTimers.get(discordId);
  if (existing) clearTimeout(existing);
  roleChangeTimers.delete(discordId);
  noCivRoleSince.delete(discordId);
}

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

let serverSafetyValidUntil = 0;
let serverSafetyCheck: Promise<void> | null = null;

async function verifyServerSafety() {
  if (Date.now() < serverSafetyValidUntil) return;
  if (!serverSafetyCheck) {
    serverSafetyCheck = (async () => {
      const response = await axios.get<{ syncPolicy?: string }>(apiUrl('/linked'), {
        headers: authorization(),
        timeout: 15000,
      });
      if (response.data?.syncPolicy !== 'civ-characters-only-v1') {
        throw new Error('Unsafe or outdated lion_civsync server resource. Deploy the CIV-only sync resource before enabling automatic synchronization.');
      }
      serverSafetyValidUntil = Date.now() + 30000;
    })().finally(() => {
      serverSafetyCheck = null;
    });
  }
  await serverSafetyCheck;
}

async function requestSync(discordId: string, target: SyncTarget): Promise<SyncResult> {
  await verifyServerSafety();
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
    : `Tvoje aktuální skupina je **${target.label}** (\u0060${target.group}\u0060). Aktualizovány byly pouze postavy, které už měly CIV skupinu. Postavy se skupinou user nebo jinou ne-CIV skupinou zůstaly beze změny.`;

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
      if (roleChangeTimers.has(member.id)) return deferredSync('pending');
      const actual = await member.guild.members.fetch({ user: member.id, force: true });
      if (roleChangeTimers.has(member.id)) return deferredSync('pending');
      const target = resolveCivGroup(actual.roles.cache);

      if (target.group === 'user') {
        const now = Date.now();
        const absentSince = noCivRoleSince.get(member.id) ?? now;
        noCivRoleSince.set(member.id, absentSince);
        const remainingMs = absentSince + roleRemovalGraceMs - now;
        if (remainingMs > 0) {
          scheduleRoleSyncTimer(actual, remainingMs);
          return deferredSync('user');
        }
      } else {
        noCivRoleSince.delete(member.id);
      }

      const result = await performSync(actual.id, target, actual.user, sendDm);
      noCivRoleSince.delete(member.id);
      knownLinked.add(member.id);
      return result;
    } catch (error) {
      knownLinked.delete(member.id);
      throw error;
    }
  });
}

export function syncRemovedMember(discordId: string, user: User) {
  cancelCivRoleSync(discordId);
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
    const response = await axios.get<{ linked: string[]; syncPolicy?: string }>(apiUrl('/linked'), {
      headers: authorization(),
      timeout: 15000,
    });
    if (response.data.syncPolicy !== 'civ-characters-only-v1') throw new Error('Unsafe or outdated lion_civsync FiveM resource; automatic sync is disabled until the safe version is deployed.');
    if (!Array.isArray(response.data.linked)) throw new Error('Invalid linked users response');
    const fullScan = lastFullScan === 0 || Date.now() - lastFullScan > 30 * 60 * 1000;
    const ids = response.data.linked.filter((id) =>
      /^\d{16,22}$/.test(id) && !roleChangeTimers.has(id) && (fullScan || !knownLinked.has(id)),
    );
    for (let i = 0; i < ids.length; i += 4) {
      const batch = ids.slice(i, i + 4);
      await Promise.all(batch.map(async (id) => {
        try {
          const member = await guild.members.fetch({ user: id, force: true });
          const result = await syncMember(member, true);
          if (result.status === 'ok') knownLinked.add(id);
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
