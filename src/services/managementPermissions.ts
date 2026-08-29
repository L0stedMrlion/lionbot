import type { RowDataPacket } from 'mysql2';
import db from '../utils/db';
import { INITIAL_MANAGEMENT_USERS } from '../config/management';

interface CountRow extends RowDataPacket {
  total: number;
}

interface PermissionRow extends RowDataPacket {
  allowed: number;
}

let initializationPromise: Promise<void> | null = null;

async function initialize() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bot_management_permissions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      discord_id VARCHAR(32) NOT NULL,
      name VARCHAR(100) NOT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_bot_management_permissions_discord_id (discord_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [rows] = await db.execute<CountRow[]>(
    'SELECT COUNT(*) AS total FROM bot_management_permissions',
  );

  if (Number(rows[0]?.total ?? 0) !== 0) return;

  for (const user of INITIAL_MANAGEMENT_USERS) {
    await db.execute(
      `INSERT INTO bot_management_permissions (discord_id, name, active)
       VALUES (?, ?, 1)`,
      [user.discordId, user.name],
    );
  }
}

export async function initializeManagementPermissions() {
  if (!initializationPromise) {
    initializationPromise = initialize().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

export async function hasManagementPermission(discordId: string) {
  await initializeManagementPermissions();

  const [rows] = await db.execute<PermissionRow[]>(
    `SELECT 1 AS allowed
     FROM bot_management_permissions
     WHERE discord_id = ? AND active = 1
     LIMIT 1`,
    [discordId],
  );

  return rows.length > 0;
}
