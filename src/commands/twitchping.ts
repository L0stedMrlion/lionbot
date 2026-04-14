import { MessageFlags, GuildMemberRoleManager } from 'discord.js';
import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';
import { config } from '../config';

export const data: CommandData = {
  name: 'twitchping',
  description: 'Sends a ping about the start of a stream!',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export async function run({ interaction, client }: SlashCommandProps) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const member = interaction.member;

  if (!interaction.guild || !member || !('roles' in member)) {
    return interaction.editReply(
      '❌ This command can only be used on a server.',
    );
  }

  const hasRole = (member.roles as GuildMemberRoleManager).cache.has(
    config.discord.roles.twitchPingRequired,
  );

  if (!hasRole) {
    return interaction.editReply(
      '❌ You do not have permission to use this command.',
    );
  }

  try {
    const guild = await client.guilds
      .fetch(config.discord.guilds.main)
      .catch(() => null);
    if (!guild) {
      return interaction.editReply(
        "❌ Bot doesn't have access to the target server.",
      );
    }

    const channel = await guild.channels
      .fetch(config.discord.channels.twitchPing)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) {
      return interaction.editReply(
        '❌ Failed to find the target text channel.',
      );
    }

    await channel.send({
      content: `<@&${config.discord.roles.twitchPingTarget}>, v případě, že nechceš dostávat Twitch Ping, můžeš si to vypnout <id:customize>`,
    });

    await interaction.editReply('✅ Twitch ping was sent successfully!');
  } catch (error) {
    console.error('Error sending twitch ping:', error);
    await interaction.editReply('❌ An error occurred while sending the ping.');
  }
}

export const options: CommandOptions = {
  devOnly: false,
  userPermissions: [],
  botPermissions: [],
  deleted: false,
};
