import type {
  CommandData,
  ChatInputCommandContext,
  CommandMetadata,
} from 'commandkit';
import {
  MessageFlags,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SectionBuilder,
} from 'discord.js';

export const command: CommandData = {
  name: 'nvlcfix',
  description: 'Shows how to fix the Not a valid client connection error',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export async function chatInput({ interaction }: ChatInputCommandContext) {
  const textComponent = new TextDisplayBuilder().setContent(
    '# 🔧 Lion Police Roleplay - Řešení chyby při připojení\n\n' +
      'Pokud se Vám při připojování na server zobrazí následující chyba:\n\n' +
      '```text\n' +
      'Obtaining configuration from server failed.\n' +
      'Error text: Not a valid client.\n' +
      '```\n' +
      '### ✅ Řešení tohoto problému\n' +
      'Otevřete ve FiveM konzoli pomocí **F8** a zadejte následující command:\n\n' +
      '```text\n' +
      'connect roleplay.lionsproject.eu\n' +
      '```\n' +
      'Následně command potvrďte **Enter** a FiveM Vás připojí přímo na server.',
  );

  const thumbnailComponent = new ThumbnailBuilder({
    media: {
      url: 'https://cdn.discordapp.com/emojis/1292049154402549762.png',
    },
  });

  const sectionComponent = new SectionBuilder()
    .addTextDisplayComponents(textComponent)
    .setThumbnailAccessory(thumbnailComponent);

  await interaction.reply({
    flags: MessageFlags.IsComponentsV2,
    components: [sectionComponent],
  });
}
