import { MessageFlags, GuildMemberRoleManager } from 'discord.js';
import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';
import axios from 'axios';
import { config } from '../config';

export const data: CommandData = {
  name: 'claimciv',
  description: 'Get civilian status directly in-game.',
  integration_types: [0],
  contexts: [0],
};

export async function run({ interaction }: SlashCommandProps) {
  const member = interaction.member;

  if (
    !member ||
    !('roles' in member) ||
    !(member.roles as GuildMemberRoleManager).cache.has(
      config.discord.roles.claimCivRequired,
    )
  ) {
    return interaction.reply({
      content: "❌ You can't use this command. You are not civilian.",
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const discordId = interaction.user.id;

  const { ip, port, resourceName, apiKey } = config.gameServer;
  const serverUrl = `http://${ip}:${port}/${resourceName}`;

  try {
    const response = await axios.post(
      `${serverUrl}/claim`,
      {
        discordId: discordId,
        apiKey: apiKey,
      },
      { timeout: 5000 },
    );

    const { playerName, serverId } = response.data;

    await interaction.editReply({
      content: `✅ Request for **${interaction.user.username}** sent!\n\n🎮 **In-game:** ${playerName} (ID: ${serverId})\n🆔 **Discord ID:** \`${discordId}\`\n\nPlease continue in-game and confirm the dialog. If you didn't receive anything, try again!`,
    });
  } catch (error: any) {
    console.error('Bot claim error:', error.message);

    let errorMessage =
      '❌ Failed to contact the game server. Ensure you are online.';

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        errorMessage =
          '❌ Connection to the game server timed out. Please try again.';
      } else if (error.response?.data?.message === 'Player is not online') {
        errorMessage = `❌ Player **${interaction.user.username}** was not found on the server. You must be in-game with Discord running.`;
      } else if (error.response) {
        errorMessage = `❌ Game server error: ${error.response.data.message || error.message}`;
      }
    }

    await interaction.editReply({
      content: errorMessage,
    });
  }
}

export const options: CommandOptions = {
  devOnly: false,
  userPermissions: [],
  botPermissions: [],
  deleted: false,
};
