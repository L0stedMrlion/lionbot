import { CommandData, SlashCommandProps, CommandOptions } from 'commandkit';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord.js';

export const data: CommandData = {
  name: 'nve',
  description: 'Shows link where you can download NVE',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export async function run({ interaction, client, handler }: SlashCommandProps) {
  const embed = new EmbedBuilder()
    .setTitle('🌴 NVE Download')
    .setDescription(
      'Níže najdeš odkaz, kde můžeš stáhnout NVE, jedná se o verzi September 2025.',
    )
    .setColor('#00A36C')
    .setFooter({
      text: '🦁 Lion Police Roleplay',
    });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Download NVE')
      .setURL(
        'https://drive.google.com/file/d/1qDnFCTzAP--n9J4xHM_joLG2KrG1hWhx/view',
      )
      .setStyle(ButtonStyle.Link)
      .setEmoji('💾'),

    new ButtonBuilder()
      .setLabel("Mrlion's Configuration")
      .setCustomId('nve_config')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⚙️'),
  );

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 3_600_000,
  });

  collector.on('collect', async (i) => {
    if (i.customId === 'nve_config') {
      const configEmbed = new EmbedBuilder()
        .setTitle("⚙️ Mrlion's Configuration")
        .setDescription('Here is the configuration for NVE.')
        .addFields({
          name: '🏓 Addons',
          value:
            '```Snížena snowflake intensity\nDarker Nights\n2020 Weather Filter\nAnimated Gas stations & ATMs\nWeather Override```',
        })
        .setColor('#00A36C');

      await i.reply({
        embeds: [configEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }
  });
}

export const options: CommandOptions = {
  devOnly: false,
  userPermissions: ['Administrator', 'AddReactions'],
  botPermissions: ['Administrator', 'AddReactions'],
  deleted: false,
};
