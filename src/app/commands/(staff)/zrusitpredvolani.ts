import {
  ApplicationCommandOptionType,
  MessageFlags,
  type AutocompleteInteraction,
} from 'discord.js';
import type {
  AutocompleteCommand,
  ChatInputCommandContext,
  CommandData,
} from 'commandkit';
import {
  createManagementEmbed,
  sendManagementLog,
  truncateChoiceName,
} from '../../../utils/managementCommands';
import {
  cancelPredvolani,
  cleanLspdNickname,
  formatCzechDate,
  getActivePredvolani,
  getActivePredvolaniById,
  getLspdGuild,
  isPredvolaniManager,
  type PredvolaniRecord,
} from '../../../services/predvolani';

export const command: CommandData = {
  name: 'zrusitpredvolani',
  description: 'Cancel active summons that you made',
  options: [
    {
      name: 'predvolani',
      description: 'Choose the player you want de-summon',
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
      required: true,
    },
  ],
};

async function resolveNames(
  interaction: AutocompleteInteraction,
  entries: PredvolaniRecord[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  try {
    const guild = await getLspdGuild(interaction.client);
    const ids = [...new Set(entries.map((row) => row.discord_id))].slice(0, 75);

    // Discord's GuildMembers intent is already enabled in src/app.ts.
    if (ids.length > 0) {
      try {
        await guild.members.fetch({ user: ids, time: 1300 });
      } catch (error) {
        // Use guild cache or the last name recorded from this guild.
        console.warn('Unable to refresh LSPD nicknames for autocomplete:', error);
      }
    }

    for (const entry of entries) {
      const member = guild.members.cache.get(entry.discord_id);
      if (member) {
        names.set(entry.discord_id, cleanLspdNickname(member.nickname ?? member.displayName));
      }
    }
  } catch (error) {
    console.warn('LSPD guild unavailable for predvolani autocomplete:', error);
  }
  return names;
}

async function respondAutocomplete(interaction: AutocompleteInteraction) {
  try {
    if (!isPredvolaniManager(interaction)) {
      await interaction.respond([]);
      return;
    }

    const input = String(interaction.options.getFocused()).trim().toLocaleLowerCase('cs');
    const active = await getActivePredvolani(interaction.user.id);
    if (active.length === 0) {
      await interaction.respond([]);
      return;
    }

    let guildCache;
    try {
      guildCache = (await getLspdGuild(interaction.client)).members.cache;
    } catch {
      guildCache = undefined;
    }

    const matching = active
      .filter((entry) => {
        const current = guildCache?.get(entry.discord_id);
        const nickname = current
          ? cleanLspdNickname(current.nickname ?? current.displayName)
          : entry.guild_nickname;
        return (
          !input ||
          nickname.toLocaleLowerCase('cs').includes(input) ||
          entry.guild_nickname.toLocaleLowerCase('cs').includes(input) ||
          entry.discord_id.includes(input) ||
          entry.event_time.includes(input)
        );
      })
      .slice(0, 75);

    const names = await resolveNames(interaction, matching);
    const choices = matching
      .map((entry) => ({
        entry,
        name: `${names.get(entry.discord_id) ?? cleanLspdNickname(entry.guild_nickname)} - ${entry.event_time.slice(0, 5)}`,
      }))
      .filter(({ entry, name }) =>
        !input ||
        name.toLocaleLowerCase('cs').includes(input) ||
        entry.discord_id.includes(input) ||
        entry.guild_nickname.toLocaleLowerCase('cs').includes(input),
      );

    const counts = new Map<string, number>();
    for (const choice of choices) counts.set(choice.name, (counts.get(choice.name) ?? 0) + 1);

    await interaction.respond(
      choices.slice(0, 25).map(({ entry, name }) => ({
        name: truncateChoiceName(
          (counts.get(name) ?? 0) > 1
            ? `${name} (${formatCzechDate(entry.event_date)})`
            : name,
        ),
        value: String(entry.id), // ID, not nickname: unique and safe to cancel
      })),
    );
  } catch (error) {
    console.error('Predvolani cancellation autocomplete failed:', error);
    if (!interaction.responded) await interaction.respond([]).catch(() => undefined);
  }
}

export const autocomplete: AutocompleteCommand = async ({ interaction }) => {
  await respondAutocomplete(interaction);
};

export async function chatInput({ interaction }: ChatInputCommandContext) {
  if (!isPredvolaniManager(interaction)) {
    await interaction.reply({
      content: '❌ Nemáte oprávnění ke zrušení předvolání.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const rawId = interaction.options.getString('predvolani', true);
  if (!/^\d{1,15}$/.test(rawId) || !Number.isSafeInteger(Number(rawId)) || Number(rawId) < 1) {
    await interaction.editReply({
      content: '❌ Neplatné předvolání. Vyberte položku z nabídky.',
    });
    return;
  }

  try {
    const id = Number(rawId);
    const entry = await getActivePredvolaniById(id, interaction.user.id);
    if (!entry) {
      await interaction.editReply({
        content: '⚠️ Předvolání neexistuje, už bylo zrušeno nebo ho vytvořil někdo jiný.',
      });
      return;
    }

    const cancelled = await cancelPredvolani(id, interaction.user.id);
    if (!cancelled) {
      await interaction.editReply({
        content: '⚠️ Předvolání již není aktivní nebo ho nemáte oprávnění zrušit.',
      });
      return;
    }

    const name = cleanLspdNickname(entry.guild_nickname);
    let dmSent = false;
    try {
      const user = await interaction.client.users.fetch(entry.discord_id);
      await user.send({
        embeds: [
          createManagementEmbed(
            '❌ Zrušení předvolání – Lion Police Roleplay',
            `Dobrý den, **${name}**,\n\n` +
              `Vaše předvolání na **${formatCzechDate(entry.event_date)} v ${entry.event_time.slice(0, 5)}** ` +
              `bylo **zrušeno**.\n\n` +
              `Na původní termín se již nemusíte dostavit.`,
          ),
        ],
      });
      dmSent = true;
    } catch (dmError) {
      console.warn(`Could not deliver cancelled predvolani DM to ${entry.discord_id}:`, dmError);
    }

    await interaction.editReply({
      embeds: [
        createManagementEmbed(
          '✅ Předvolání zrušeno',
          `**${name} - ${entry.event_time.slice(0, 5)}**\n` +
            `📅 ${formatCzechDate(entry.event_date)}\n` +
            `👤 <@${entry.discord_id}>\n\n` +
            (dmSent
              ? '✅ Hráči bylo odesláno oznámení o zrušení do DM.'
              : '⚠️ Předvolání bylo zrušeno, ale hráči nelze doručit DM (pravděpodobně má zprávy vypnuté).'),
        ),
      ],
    });

    await sendManagementLog(interaction, {
      system: 'LSPD Předvolání',
      action: 'REMOVE',
      target: `<@${entry.discord_id}> (${name})`,
      details: `Zrušený termín: ${formatCzechDate(entry.event_date)} ${entry.event_time.slice(0, 5)}\nID: ${id}\nDM: ${dmSent ? 'Sent' : 'Failed'}`,
    });
  } catch (error) {
    console.error('Could not cancel predvolani:', error);
    await interaction.editReply({
      content: '❌ Zrušení se nepodařilo dokončit kvůli chybě databáze.',
    });
  }
}
