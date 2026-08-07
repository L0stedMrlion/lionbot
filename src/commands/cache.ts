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
  name: 'cache',
  description: 'Sends instructions for deleting FiveM cache',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export function run({ interaction }: SlashCommandProps) {
  const textComponent = new TextDisplayBuilder().setContent(
    '# 🗑️ Lion Police Roleplay - Smazání cache\n\n' +
      'Smazání cache může vyřešit problémy s načítáním serveru, texturami a dalšími problémy.\n\n' +
      '### 1. Vypněte FiveM\n' +
      'Nejdříve kompletně vypněte FiveM, včetně procesu v pozadí. Toto lze skontrolovat pomocí Task Manageru stisknutím `Ctrl + Shift + Esc`, ale není nutno to dělat.\n\n' +
      '### 2. Otevřete složku FiveM\n' +
      'Stiskněte zkratku `Windows + R` a vložte tam:\n' +
      '```text\n%localappdata%\\FiveM\\FiveM.app\\data\n```\n' +
      'Poté potvrďte pomocí `Enter`.\n\n' +
      '### 3. Smažte cache\n' +
      'V otevřené složce smažte následující složky:\n\n' +
      '- `cache`\n' +
      '- `server-cache`\n' +
      '- `server-cache-priv`\n\n' +
      'Složku `game-storage` a `nui-storage` nedoporučujeme mazat.\n\n' +
      '### 4. Zapněte FiveM\n' +
      'Po odstranění složek znovu zapněte FiveM a připojte se na server. První připojení může kvůli opětovnému stahování všech resource trvat déle.' +
      '\n\n### ⚡ Video tutoriál: Jak vymazat cache\n' +
      'Pro hráče, kteří nechtějí číst psaný tutoriál je níže přiložen video tutoriál.',
  );

  const thumbnailComponent = new ThumbnailBuilder({
    media: {
      url: 'https://cdn.discordapp.com/emojis/1292049154402549762.png',
    },
  });

  const videoButton = new ButtonBuilder()
    .setLabel('⚡ Video tutoriál - Mazání cache')
    .setStyle(ButtonStyle.Link)
    .setURL('https://www.youtube.com/watch?v=9Jq16iEzyOI');

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    videoButton,
  );

  const sectionComponent = new SectionBuilder()
    .addTextDisplayComponents(textComponent)
    .setThumbnailAccessory(thumbnailComponent);

  return interaction.reply({
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
