import { EmbedBuilder, MessageFlags } from 'discord.js';
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from 'discord.js';

const EMBED_COLOR = 12088115;
const FOOTER_TEXT = '🦁 Lion Police Roleplay';
const FOOTER_ICON =
  'https://mintcdn.com/lionpoliceroleplay/BtD-j6OxC9jgAPew/public/lionmain_logo.png?w=840&fit=max&auto=format&n=BtD-j6OxC9jgAPew&q=85&s=ec0ba702a756f34f3d581daff4b14430';

export function createManagementEmbed(title: string, description?: string) {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(title)
    .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });

  if (description) embed.setDescription(description);

  return embed;
}

export function hasManagementAccess(
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  permissions: string[],
) {
  if (permissions.includes(interaction.user.id)) return true;

  const member = interaction.member;
  if (!interaction.inGuild() || !member || !('roles' in member)) return false;

  const roles = (member as any).roles;

  return permissions.some((id) =>
    Array.isArray(roles) ? roles.includes(id) : roles?.cache?.has(id),
  );
}

export async function ensureManagementAccess(
  interaction: ChatInputCommandInteraction,
  permissions: string[],
) {
  if (hasManagementAccess(interaction, permissions)) return true;

  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({
      embeds: [
        createManagementEmbed(
          'Permission Denied',
          'You do not have permission to use this command.',
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  return false;
}

export function createListEmbeds(title: string, lines: string[]) {
  const chunks: string[] = [];
  let current = '';

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;

    if (next.length > 3800) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  if (chunks.length === 0) chunks.push('No active entries.');

  return chunks.map((description, index) => {
    const embed = createManagementEmbed(
      chunks.length > 1 ? `${title} (${index + 1}/${chunks.length})` : title,
      description,
    );

    if (index === chunks.length - 1) {
      embed.addFields({ name: 'Total', value: String(lines.length), inline: true });
    }

    return embed;
  });
}

export async function sendListEmbeds(
  interaction: ChatInputCommandInteraction,
  embeds: EmbedBuilder[],
) {
  await interaction.editReply({ embeds: [embeds[0]] });

  for (let i = 1; i < embeds.length; i++) {
    await interaction.followUp({
      embeds: [embeds[i]],
      flags: MessageFlags.Ephemeral,
    });
  }
}

export function truncateChoiceName(value: string) {
  return value.length <= 100 ? value : `${value.slice(0, 97)}...`;
}
