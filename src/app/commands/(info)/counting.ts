import type { ChatInputCommandContext, CommandData } from 'commandkit';
import {
  ApplicationCommandOptionType,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { COUNTING_CHANNEL_ID, COUNTING_MODES } from '../../../config/counting';
import {
  countingPanel,
  getCountingNumbers,
  getCountingState,
  resetCounting,
} from '../../../services/counting';

export const command: CommandData = {
  name: 'counting',
  description: 'Counting mode information and administration',
  integration_types: [0],
  contexts: [0],
  options: [
    { name: 'status', description: 'Current counting mode', type: ApplicationCommandOptionType.Subcommand },
    { name: 'reset', description: 'Change counting mode (Administrator only)', type: ApplicationCommandOptionType.Subcommand },
  ],
};

export async function chatInput({ interaction, client }: ChatInputCommandContext) {
  if (interaction.channelId === COUNTING_CHANNEL_ID) {
    return interaction.reply({ content: 'Use commands outside the counting channel.', flags: MessageFlags.Ephemeral });
  }
  const subcommand = interaction.options.getSubcommand(true);
  let title = '🎯 Counting';
  let content = '';
  if (subcommand === 'status') {
    const current = getCountingState();
    if (!current) content = 'Counting is not yet available.';
    else {
      title = '🎯 Counting Status';
      const numbers = getCountingNumbers();
      content = `**Mode:** ${COUNTING_MODES[current.mode].name}\n**Target:** ${current.target}\n**Last number:** ${numbers?.last}\n**Next number:** ${numbers?.next}\n**Channel:** <#${COUNTING_CHANNEL_ID}>`;
    }
  } else if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    content = 'Administrator permission required.';
  } else {
    const success = await resetCounting(client);
    content = success ? 'A different counting mode has started.' : 'No active mode is available.';
  }
  await interaction.reply({
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [countingPanel(title, content)],
    allowedMentions: { parse: [] },
  });
}
