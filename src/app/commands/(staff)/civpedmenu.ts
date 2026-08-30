import {
  ApplicationCommandOptionType,
  MessageFlags,
  type AutocompleteInteraction,
} from 'discord.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type {
  AutocompleteCommand,
  ChatInputCommandContext,
  CommandData,
} from 'commandkit';
import db from '../../../utils/db';
import {
  createListEmbeds,
  createManagementEmbed,
  ensureManagementAccess,
  sendListEmbeds,
  truncateChoiceName,
  hasManagementAccess,
  sendManagementLog,
} from '../../../utils/managementCommands';

const PERMISSIONS: string[] = [
  '710549603216261141',
];

interface AllowedRow extends RowDataPacket {
  discord_id: string;
  name: string | null;
}

export const command: CommandData = {
  name: 'civpedmenu',
  description: 'Manage civilian PED menu permissions',
  options: [
    {
      name: 'list',
      description: 'List active Civilian PED Menu permissions',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'add',
      description: 'Add or reactivate a Civilian PED Menu permission',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'user',
          description: 'Discord user to allow',
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      description: 'Remove an active Civilian PED Menu permission',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'user',
          description: 'Active Civilian PED Menu user to remove',
          type: ApplicationCommandOptionType.String,
          autocomplete: true,
          required: true,
        },
      ],
    },
  ],
};

async function respondAutocomplete(interaction: AutocompleteInteraction) {
  try {
    if (!hasManagementAccess(interaction, PERMISSIONS)) {
      await interaction.respond([]);
      return;
    }

    if (interaction.options.getSubcommand(false) !== 'remove') {
      await interaction.respond([]);
      return;
    }

    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'user') {
      await interaction.respond([]);
      return;
    }

    const input = String(focused.value).trim().toLowerCase();
    const [rows] = await db.execute<AllowedRow[]>(
      `SELECT discord_id, name
       FROM ped_allowed
       WHERE active = 1
       ORDER BY name ASC`,
    );

    const choices = rows
      .filter(
        (row) =>
          !input ||
          (row.name ?? row.discord_id).toLowerCase().includes(input) ||
          row.discord_id.includes(input),
      )
      .slice(0, 25)
      .map((row) => ({
        name: truncateChoiceName(`${row.name ?? row.discord_id} — ${row.discord_id}`),
        value: row.discord_id,
      }));

    await interaction.respond(choices);
  } catch (error) {
    console.error('Civilian PED Menu autocomplete failed:', error);
    if (!interaction.responded) await interaction.respond([]).catch(() => undefined);
  }
}

export const autocomplete: AutocompleteCommand = async ({ interaction }) => {
  await respondAutocomplete(interaction);
};

export async function chatInput({ interaction }: ChatInputCommandContext) {
  if (!(await ensureManagementAccess(interaction, PERMISSIONS))) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const subcommand = interaction.options.getSubcommand(true);

    if (subcommand === 'list') {
      const [rows] = await db.execute<AllowedRow[]>(
        `SELECT discord_id, name
         FROM ped_allowed
         WHERE active = 1
         ORDER BY name ASC`,
      );

      const lines = rows.map(
        (row) => `${row.name ?? row.discord_id} — \`${row.discord_id}\``,
      );
      const embeds = createListEmbeds('Civilian PED Menu Permissions', lines);
      await sendListEmbeds(interaction, embeds);
      await sendManagementLog(interaction, {
        system: 'Civilian PED Menu Permissions',
        action: 'LIST',
        target: `${rows.length} active entries`,
        details: 'Viewed the active Civilian PED Menu permission list.',
      });
      return;
    }

    if (subcommand === 'add') {
      const user = interaction.options.getUser('user', true);
      const name = user.globalName ?? user.username;

      await db.execute<ResultSetHeader>(
        `INSERT INTO ped_allowed (discord_id, name, active)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           active = 1`,
        [user.id, name],
      );

      await interaction.editReply({
        embeds: [
          createManagementEmbed(
            'Civilian PED Menu Permission Added',
            `**User:** ${name}\n**Discord ID:** \`${user.id}\`\n\nRun **/refreshperms** in-game to apply the change.`,
          ),
        ],
      });
      await sendManagementLog(interaction, {
        system: 'Civilian PED Menu Permissions',
        action: 'ADD',
        target: `<@${user.id}>`,
        details: `Name: **${name}**\nDiscord ID: \`${user.id}\`\nStatus: Active\nFiveM cache: Requires **/refreshperms**`,
      });
      return;
    }

    const discordId = interaction.options.getString('user', true);
    const [rows] = await db.execute<AllowedRow[]>(
      `SELECT discord_id, name
       FROM ped_allowed
       WHERE discord_id = ? AND active = 1
       LIMIT 1`,
      [discordId],
    );

    const entry = rows[0];
    if (!entry) {
      await interaction.editReply({
        embeds: [
          createManagementEmbed(
            'Civilian PED Menu Permission Not Found',
            'That Civilian PED Menu permission is not active or no longer exists.',
          ),
        ],
      });
      return;
    }

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE ped_allowed
       SET active = 0
       WHERE discord_id = ? AND active = 1`,
      [discordId],
    );

    if (result.affectedRows === 0) {
      await interaction.editReply({
        embeds: [
          createManagementEmbed(
            'Civilian PED Menu Permission Not Found',
            'That Civilian PED Menu permission is already inactive or no longer exists.',
          ),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        createManagementEmbed(
          'Civilian PED Menu Permission Removed',
          `Civilian PED Menu permission removed from **${entry.name ?? entry.discord_id}**.\n\nRun **/refreshperms** in-game to apply the change.`,
        ),
      ],
    });
    await sendManagementLog(interaction, {
      system: 'Civilian PED Menu Permissions',
      action: 'REMOVE',
      target: `<@${entry.discord_id}>`,
      details: `Name: **${entry.name ?? entry.discord_id}**\nDiscord ID: \`${entry.discord_id}\`\nStatus: Inactive\nFiveM cache: Requires **/refreshperms**`,
    });
  } catch (error) {
    console.error('Civilian PED Menu management command failed:', error);
    await interaction.editReply({
      embeds: [
        createManagementEmbed(
          'Database Error',
          'Database error while processing the Civilian PED Menu command.',
        ),
      ],
    });
  }
}
