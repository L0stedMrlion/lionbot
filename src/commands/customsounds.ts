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
  name: 'sounds',
  description: 'Sends information about custom GTA5 sounds',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export function run({ interaction }: SlashCommandProps) {
  const textComponent = new TextDisplayBuilder().setContent(
    '# 🔊 Lion Police Roleplay - Custom Sounds\n\n' +
      '### 📂 Návod na instalaci\n' +
      '1. Stáhněte si soundy, který chcete do hry přidat.\n' +
      '2. Otevřete složku své hry **GTAV**. Pokud nevíte, kde ji máte doporučuji jít přes Epic/Steam/Rockstar a najít installed files.\n' +
      '3. Přejděte do složky `x64` -> `audio` -> `sfx`.\n' +
      '4. Zde nahraďte původní soubory staženými soubory `.rpf`.\n\n' +
      '> ⚠️ **DŮLEŽITÉ:** Před nahráváním souborů do hry musíte mít kompletně vypnuté GTA 5 i FiveM\n\n' +
      '### 📢 Doporučené soundy\n' +
      'Níže přes button si můžete stáhnout **Whelen Sounds Pack**, který obsahuje upravené zvuky zbraní (WEAPONS_PLAYER.rpf) a sirén (RESIDENT.rpf)',
  );

  const button = new ButtonBuilder()
    .setLabel('🔗 Whelen Sounds Pack')
    .setStyle(ButtonStyle.Link)
    .setURL(
      'https://www.lcpdfr.com/downloads/gta5mods/audio/22641-whelen-cencom-saphire-siren-weapons-sounds-pack-fivem-ready/',
    );

  const button2 = new ButtonBuilder()
    .setLabel('🔗 LSPDFR Vyhledání dalších soundů')
    .setStyle(ButtonStyle.Link)
    .setURL('https://www.lcpdfr.com/downloads/gta5mods/audio/');

  const thumbnailComponent = new ThumbnailBuilder({
    media: {
      url: 'https://cdn.discordapp.com/emojis/1292049154402549762.png',
    },
  });

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    button,
    button2,
  );

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
  deleted: false,
};
