import type { Client, Guild, GuildMember } from 'discord.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../utils/db';

export const LSPD_GUILD_ID = '1348336228411375729';
export const MAIN_GUILD_ID = '1286329202723000431';

export interface PredvolaniRecord extends RowDataPacket {
  id: number;
  discord_id: string;
  guild_nickname: string;
  event_date: string;
  event_time: string;
  reason: string | null;
}

export function cleanLspdNickname(nickname: string): string {
  return (
    nickname
      .replace(/^\s*(?:\[[^\]\r\n]{1,35}\]\s*)+/u, '')
      .replace(/\s*\(\s*\d{1,10}\s*\)\s*$/u, '')
      .replace(/\s+/gu, ' ')
      .trim() || nickname.trim()
  );
}

export function formatCzechDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}.${month}.${year}`;
}

export function validateCzechDate(raw: string): string | null {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/.exec(raw.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function validateTime(raw: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function commaSeparatedIds(value: string | undefined): string[] {
  return (value ?? '')
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter((id) => /^\d{17,20}$/.test(id));
}

export function isPredvolaniManager(interaction: {
  guildId: string | null;
  user: { id: string };
  memberPermissions: { has: (permission: bigint) => boolean } | null;
  member: unknown;
}): boolean {
  if (![MAIN_GUILD_ID, LSPD_GUILD_ID].includes(interaction.guildId ?? '')) {
    return false;
  }

  if (interaction.memberPermissions?.has(32n)) return true;
  if (commaSeparatedIds(process.env.PREDVOLANI_ALLOWED_USER_IDS).includes(interaction.user.id)) {
    return true;
  }

  const roleIds = commaSeparatedIds(process.env.PREDVOLANI_ALLOWED_ROLE_IDS);
  const member = interaction.member;
  if (!member || typeof member !== 'object' || !('roles' in member)) return false;
  const roles = (member as { roles: string[] | { cache?: { has: (id: string) => boolean } } }).roles;
  return roleIds.some((id) =>
    Array.isArray(roles) ? roles.includes(id) : Boolean(roles.cache?.has(id)),
  );
}

let initialization: Promise<void> | undefined;

export function ensurePredvolaniTable(): Promise<void> {
  if (!initialization) {
    initialization = db
      .query(`
        CREATE TABLE IF NOT EXISTS lion_predvolani (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          discord_id VARCHAR(20) NOT NULL,
          guild_nickname VARCHAR(100) NOT NULL,
          event_date DATE NOT NULL,
          event_time CHAR(5) NOT NULL,
          reason TEXT NULL,
          status VARCHAR(12) NOT NULL DEFAULT 'active',
          created_by VARCHAR(20) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          cancelled_by VARCHAR(20) NULL,
          cancelled_at TIMESTAMP NULL,
          INDEX idx_predvolani_active (status, event_date, event_time)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      .then(() => undefined)
      .catch((error) => {
        initialization = undefined;
        throw error;
      });
  }
  return initialization;
}

export async function getLspdGuild(client: Client): Promise<Guild> {
  return client.guilds.fetch(LSPD_GUILD_ID);
}

export async function getLspdMember(client: Client, userId: string): Promise<GuildMember | null> {
  const guild = await getLspdGuild(client);
  return guild.members.fetch(userId).catch(() => null);
}

export function nicknameFromLspdMember(member: GuildMember): string {
  return cleanLspdNickname(member.nickname ?? member.displayName);
}

export async function createPredvolani(input: {
  discordId: string;
  guildNickname: string;
  eventDate: string;
  eventTime: string;
  reason: string | null;
  createdBy: string;
}): Promise<number> {
  await ensurePredvolaniTable();
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO lion_predvolani
      (discord_id, guild_nickname, event_date, event_time, reason, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.discordId,
      input.guildNickname,
      input.eventDate,
      input.eventTime,
      input.reason,
      input.createdBy,
    ],
  );
  return result.insertId;
}

const SELECT_FIELDS = `
  id, discord_id, guild_nickname,
  DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
  event_time, reason
`;

export async function getActivePredvolani(createdBy: string): Promise<PredvolaniRecord[]> {
  await ensurePredvolaniTable();
  const [rows] = await db.query<PredvolaniRecord[]>(
    `SELECT ${SELECT_FIELDS}
     FROM lion_predvolani
     WHERE status = 'active' AND created_by = ?
     ORDER BY event_date ASC, event_time ASC, id ASC
     LIMIT 500`,
    [createdBy],
  );
  return rows;
}

export async function getActivePredvolaniById(id: number, createdBy: string): Promise<PredvolaniRecord | null> {
  await ensurePredvolaniTable();
  const [rows] = await db.execute<PredvolaniRecord[]>(
    `SELECT ${SELECT_FIELDS}
     FROM lion_predvolani
     WHERE id = ? AND status = 'active' AND created_by = ?
     LIMIT 1`,
    [id, createdBy],
  );
  return rows[0] ?? null;
}

export async function cancelPredvolani(id: number, cancelledBy: string): Promise<boolean> {
  await ensurePredvolaniTable();
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE lion_predvolani
     SET status = 'cancelled', cancelled_by = ?, cancelled_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status = 'active' AND created_by = ?`,
    [cancelledBy, id, cancelledBy],
  );
  return result.affectedRows === 1;
}
