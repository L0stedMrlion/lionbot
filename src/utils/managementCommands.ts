import { EmbedBuilder, MessageFlags } from 'discord.js';
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  MANAGEMENT_ALLOWED_ROLE_IDS,
  MANAGEMENT_ALLOWED_USER_IDS,
} from '../config/management';

export function hasManagementAccess(
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
) {
  if (MANAGEMENT_ALLOWED_USER_IDS.includes(interaction.user.id)) {
    return true;
  }

  const member = interaction.member;
  if (!interaction.inGuild() || !member || !('roles' in member)) {
    return false;
  }

  const roles = (member as any).roles;

  return MANAGEMENT_ALLOWED_ROLE_IDS.some((roleId) =>
    Array.isArray(roles) ? roles.includes(roleId) : roles?.cache?.has(roleId),
  );
}

export async function ensureManagementAccess(
  interaction: ChatInputCommandInteraction,
) {
  if (hasManagementAccess(interaction)) return true;

  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({
      content: '❌ You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
  }

  return false;
}

export function createListEmbeds(
  title: string,
  lines: string[],
  totalLabel = 'Total',
) {
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
    const embed = new EmbedBuilder()
      .setTitle(chunks.length > 1 ? `${title} (${index + 1}/${chunks.length})` : title)
      .setDescription(description);

    if (index === chunks.length - 1) {
      embed.setFooter({ text: `${totalLabel}: ${lines.length}` });
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
