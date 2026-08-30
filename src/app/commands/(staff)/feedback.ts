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
  '1286330077843558531',
  "1404759432801292330",
  "1186357212717785164",
  "1287132936227000420"
];

interface FeedbackRow extends RowDataPacket {
  label: string;
  value: string;
}

export const command: CommandData = {
  name: 'feedback',
  description: 'Manage feedback civilians',
  options: [
    {
      name: 'list',
      description: 'List active feedback civilians',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'add',
      description: 'Add or reactivate a feedback civilian',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'value',
          description: 'Civilian name',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      description: 'Remove an active feedback civilian',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'civilian',
          description: 'Civilian to remove',
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
    if (focused.name !== 'civilian') {
      await interaction.respond([]);
      return;
    }

    const input = String(focused.value).trim().toLowerCase();
    const [rows] = await db.execute<FeedbackRow[]>(
      `SELECT label, value
       FROM feedbacks
       WHERE active = 1
       ORDER BY label ASC`,
    );

    const choices = rows
      .filter(
        (row) =>
          !input ||
          row.label.toLowerCase().includes(input) ||
          row.value.toLowerCase().includes(input),
      )
      .slice(0, 25)
      .map((row) => ({
        name: truncateChoiceName(row.label),
        value: row.value,
      }));

    await interaction.respond(choices);
  } catch (error) {
    console.error('Feedback autocomplete failed:', error);
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
      const [rows] = await db.execute<FeedbackRow[]>(
        `SELECT label, value
         FROM feedbacks
         WHERE active = 1
         ORDER BY label ASC`,
      );

      const lines = rows.map((row, index) => `${index + 1}. ${row.label}`);
      const embeds = createListEmbeds('Feedback Civilians', lines);
      await sendListEmbeds(interaction, embeds);
      await sendManagementLog(interaction, {
        system: 'Feedback Civilians',
        action: 'LIST',
        target: `${rows.length} active entries`,
        details: 'Viewed the active feedback civilian list.',
      });
      return;
    }

    if (subcommand === 'add') {
      const value = interaction.options.getString('value', true).trim();

      if (!value) {
        await interaction.editReply({
          embeds: [createManagementEmbed('Invalid Value', 'Value cannot be empty.')],
        });
        return;
      }

      await db.execute<ResultSetHeader>(
        `INSERT INTO feedbacks (label, value, active)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE
           label = VALUES(label),
           active = 1`,
        [value, value],
      );

      await interaction.editReply({
        embeds: [
          createManagementEmbed(
            'Feedback Civilian Added',
            `**Value:** ${value}`,
          ),
        ],
      });
      await sendManagementLog(interaction, {
        system: 'Feedback Civilians',
        action: 'ADD',
        target: `**${value}**`,
        details: `Label: **${value}**\nValue: **${value}**\nStatus: Active`,
      });
      return;
    }

    const value = interaction.options.getString('civilian', true);
    const [rows] = await db.execute<FeedbackRow[]>(
      `SELECT label, value
       FROM feedbacks
       WHERE value = ? AND active = 1
       LIMIT 1`,
      [value],
    );

    const entry = rows[0];
    if (!entry) {
      await interaction.editReply({
        embeds: [
          createManagementEmbed(
            'Feedback Civilian Not Found',
            'That feedback civilian is not active or no longer exists.',
          ),
        ],
      });
      return;
    }

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE feedbacks
       SET active = 0
       WHERE value = ? AND active = 1`,
      [value],
    );

    if (result.affectedRows === 0) {
      await interaction.editReply({
        embeds: [
          createManagementEmbed(
            'Feedback Civilian Not Found',
            'That feedback civilian is already inactive or no longer exists.',
          ),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        createManagementEmbed(
          'Feedback Civilian Removed',
          `**${entry.label}** has been removed from the feedback list.`,
        ),
      ],
    });
    await sendManagementLog(interaction, {
      system: 'Feedback Civilians',
      action: 'REMOVE',
      target: `**${entry.label}**`,
      details: `Value: **${entry.value}**\nStatus: Inactive`,
    });
  } catch (error) {
    console.error('Feedback management command failed:', error);
    await interaction.editReply({
      embeds: [
        createManagementEmbed(
          'Database Error',
          'Database error while processing the feedback command.',
        ),
      ],
    });
  }
}
