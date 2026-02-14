import { MessageFlags, TextChannel } from 'discord.js';
import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';

const REQUIRED_ROLE_ID = '1287347387706118185';
const TARGET_GUILD_ID = '1286329202723000431';
const TARGET_CHANNEL_ID = '1287133753356980329';
const PING_ROLE_ID = '1296897948348715071';

export const data: CommandData = {
  name: 'twitchping',
  description: 'Sends a ping about the start of a stream!',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export async function run({ interaction, client }: SlashCommandProps) {
  const member = interaction.member;

  if (!interaction.guild || !member || !('roles' in member)) {
    return interaction.reply({
      content: '❌ This command can only be used on a server.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const roles = member.roles;
  const hasRole = Array.isArray(roles)
    ? roles.includes(REQUIRED_ROLE_ID)
    : roles.cache.has(REQUIRED_ROLE_ID);

  if (!hasRole) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    const guild = await client.guilds.fetch(TARGET_GUILD_ID).catch(() => null);
    if (!guild) {
      return interaction.reply({
        content: "❌ Bot doesn't have access to the target server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel = await guild.channels
      .fetch(TARGET_CHANNEL_ID)
      .catch(() => null);

    if (!channel || !(channel instanceof TextChannel)) {
      return interaction.reply({
        content: '❌ Failed to find the target text channel.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await channel.send({
      content: `<@&${PING_ROLE_ID}>`,
    });

    await interaction.reply({
      content: '✅ Twitch ping was sent successfully!',
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error('Error sending twitch ping:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while sending the ping.',
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.followUp({
        content: '❌ An error occurred while sending the ping.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
};
