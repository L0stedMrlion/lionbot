import { MessageFlags } from 'discord.js';
import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';

const REQUIRED_ROLE_ID = '1287347387706118185';
const TARGET_GUILD_ID = '1286329202723000431';
const TARGET_CHANNEL_ID = '1296897838692700304';
const PING_ROLE_ID = '1286330077843558531';

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
    return interaction.editReply('❌ This command can only be used on a server.');
  }

  const roles = member.roles;
  const hasRole = Array.isArray(roles)
    ? roles.includes(REQUIRED_ROLE_ID)
    : roles.cache.has(REQUIRED_ROLE_ID);

  if (!hasRole) {
    return interaction.editReply('❌ You do not have permission to use this command.');
  }

  try {
    const guild = await client.guilds.fetch(TARGET_GUILD_ID).catch(() => null);
    if (!guild) {
      return interaction.editReply("❌ Bot doesn't have access to the target server.");
    }

    const channel = await guild.channels
      .fetch(TARGET_CHANNEL_ID)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) {
      return interaction.editReply('❌ Failed to find the target text channel.');
    }

    await channel.send({
      content: `<@&${PING_ROLE_ID}>, v případě, že nechceš dostávat Twitch Ping, můžeš si to vypnout <id:customize>`,
    });

    await interaction.editReply('✅ Twitch ping was sent successfully!');
  } catch (error) {
    console.error('Error sending twitch ping:', error);
    await interaction.editReply('❌ An error occurred while sending the ping.');
  }
}

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
};
