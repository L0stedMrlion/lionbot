import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';
import {
  MessageFlags,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  ThumbnailBuilder,
  SectionBuilder,
  ActionRowBuilder,
} from 'discord.js';

export const data: CommandData = {
  name: 'binding',
  description: 'Sends informations about binding for FiveM',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export function run({ interaction }: SlashCommandProps) {
  const textComponent = new TextDisplayBuilder().setContent(
    '# <:lionpoliceroleplay:1292049154402549762> Lion Police Roleplay - Binding\n\n' +
      'Bindovat si věci na určité klávesy je občas jednoduše, naopak občas složité, níže máte sepsáno jak se binduje přes F8.\n\n' +
      '### ⌨️ Vytvoření bindu\n' +
      'Otevřete konzoli F8 a zadejte:\n' +
      '```\nbind keyboard <key> "e whistle"\n```\n' +
      'Pro nastavení bindů na jednu klávesu použijte:\n' +
      '```\nbind keyboard <key> "e whistle; e sit; panic"\n```\n' +
      '### ⌨️ Odstranění bindu\n' +
      'Otevřete konzoli F8 a zadejte:\n' +
      '```\nunbind keyboard <key>\n```\n' +
      '### 🔑 Key\n' +
      'Vždy `<key>` nahradte nějakou klávesou, všechny jsou vypsané v oficiální dokumentaci.',
  );

  const thumbnailComponent = new ThumbnailBuilder({
    media: {
      url: 'https://cdn.discordapp.com/emojis/1292049154402549762.png',
    },
  });

  const button = new ButtonBuilder()
    .setLabel('⌨️ Keyboard Reference')
    .setStyle(ButtonStyle.Link)
    .setURL(
      'https://docs.fivem.net/docs/game-references/input-mapper-parameter-ids/keyboard/',
    );

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  const sectionComponent = new SectionBuilder()
    .addTextDisplayComponents(textComponent)
    .setThumbnailAccessory(thumbnailComponent);

  interaction.reply({
    flags: MessageFlags.IsComponentsV2,
    components: [sectionComponent, actionRow],
  });
}

export const options: CommandOptions = {
  devOnly: false,
  userPermissions: ['Administrator', 'AddReactions'],
  botPermissions: ['Administrator', 'AddReactions'],
  deleted: false,
};
