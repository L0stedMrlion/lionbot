import { CommandData, SlashCommandProps, CommandOptions } from 'commandkit';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SectionBuilder,
} from 'discord.js';

export const data: CommandData = {
  name: 'nve',
  description: 'Shows link where you can download NVE',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export async function run({ interaction }: SlashCommandProps) {
  const textComponent = new TextDisplayBuilder().setContent(
    '# 🌴 NaturalVision Evolved (NVE)\n\n' +
      'NaturalVision Evolved  populární grafický mód pro GTA V, který výrazně vylepšuje vizuální stránku hry, osvětlení a textury. Níže najdeš link ke stažení.\n\n' +
      '### 📦 Informace o souboru\n' +
      '> 📅 **Verze:** September 2025\n',
  );

  const thumbnailComponent = new ThumbnailBuilder({
    media: {
      url: 'https://cdn.discordapp.com/emojis/1292049154402549762.png',
    },
  });

  const sectionComponent = new SectionBuilder()
    .addTextDisplayComponents(textComponent)
    .setThumbnailAccessory(thumbnailComponent);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Download NVE')
      .setURL(
        'https://drive.google.com/file/d/1qDnFCTzAP--n9J4xHM_joLG2KrG1hWhx/view',
      )
      .setStyle(ButtonStyle.Link)
      .setEmoji('💾'),

    new ButtonBuilder()
      .setLabel('Optimal Configuration')
      .setCustomId('nve_config')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🛠️'),
  );

  const response = await interaction.reply({
    flags: MessageFlags.IsComponentsV2,
    components: [sectionComponent, row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 3_600_000,
  });

  collector.on('collect', async (i) => {
    if (i.customId === 'nve_config') {
      const configText = new TextDisplayBuilder().setContent(
        '### 🗂️ Aktivní Addony (Mrlion Configuration)\n' +
          '```diff\n' +
          '+ Snížena snowflake intensity\n' +
          '+ Darker Nights\n' +
          '+ 2020 Weather Filter\n' +
          '+ Animated Gas stations & ATMs\n' +
          '+ Weather Override\n' +
          '```\n' +
          '### ⚠️ Důležité: ReShade fix\n' +
          'Pokud používáš ReShade, můžeš se setkat s pády hry. Vlož toto do svého nastavení:\n' +
          '```\n[Addons]\nReShade5=ID:090a21bf acknowledged that ReShade 5.x has a bug that will lead to game crashes\n```',
      );

      const configSection = new SectionBuilder()
        .addTextDisplayComponents(configText)
        .setThumbnailAccessory(thumbnailComponent);

      await i.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [configSection],
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
