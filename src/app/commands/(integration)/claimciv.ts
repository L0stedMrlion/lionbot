import { MessageFlags } from 'discord.js';
import type { CommandData, ChatInputCommandContext } from 'commandkit';
import axios from 'axios';
import { claimCivRoleGroups } from '../../../config/claimciv';

export const command: CommandData = {
  name: 'claimciv',
  description: 'Get civilian status directly in-game',
  integration_types: [0],
  contexts: [0],
};

export async function chatInput({ interaction }: ChatInputCommandContext) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const discordId = interaction.user.id;

  let member;
  try {
    member = await interaction.guild?.members.fetch({
      user: discordId,
      force: true,
    });
  } catch (error) {
    console.error('Failed to fetch /claimciv member roles:', error);
    return interaction.editReply({
      content: '❌ Unable to verify your Discord roles right now. Try again!',
    });
  }

  if (!member) {
    return interaction.editReply({
      content: '❌ Unable to verify your Discord roles right now. Try again!',
    });
  }

  const matchedRole = claimCivRoleGroups.find(({ roleId }) =>
    member.roles.cache.has(roleId),
  );

  if (!matchedRole) {
    return interaction.editReply({
      content: "❌ You can't use this command. You don't have an eligible civilian role.",
    });
  }

  const group = matchedRole.group;
  if (group !== null && !/^[a-zA-Z0-9_-]{1,64}$/.test(group)) {
    console.error('Invalid FiveM group configured for /claimciv role:', matchedRole.roleId);
    return interaction.editReply({
      content: '❌ The civilian role is not configured correctly. Contact staff!',
    });
  }

  const serverIp = process.env.IP || 'localhost';
  const serverPort = process.env.GAMESERVER_PORT || '30120';
  const resourceName = process.env.GAMESERVER_RESOURCE_NAME || 'lion_utilities';
  const serverUrl = `http://${serverIp}:${serverPort}/${resourceName}`;
  const apiKey = process.env.GAMESERVER_API_KEY;

  try {
    const response = await axios.post(
      `${serverUrl}/claim`,
      {
        discordId,
        apiKey,
        roleId: matchedRole.roleId,
        ...(group !== null ? { group } : {}),
      },
      { timeout: 5000 },
    );

    const { playerName, serverId } = response.data;
    const groupInfo = group !== null ? `\n🛡️ **Requested group:** \`${group}\`` : '';

    await interaction.editReply({
      content: `✅ Request for **${interaction.user.username}** sent!\n\n🎮 **In-game:** ${playerName} (ID: ${serverId})\n🆔 **Discord ID:** \`${discordId}\`${groupInfo}\n\nPlease continue in-game and confirm the dialog. If you didn't receive anything, try again!`,
    });
  } catch (error: any) {
    console.error('Bot claim error:', error.message);

    let errorMessage =
      '❌ Failed to contact the game server. Ensure you are online.';

    if (error.response && error.response.data && error.response.data.message) {
      if (error.response.data.message === 'Player is not online') {
        errorMessage = `❌ Player **${interaction.user.username}** was not found on the server. You must be in-game with Discord running.`;
      } else if (error.response.data.message === 'Invalid group') {
        errorMessage =
          '❌ The selected in-game group is not allowed by the game server. Contact staff!';
      }
    }

    await interaction.editReply({
      content: errorMessage,
    });
  }
}
