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
  name: 'crosshair',
  description: 'Sends informations about crosshair',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export function run({ interaction }: SlashCommandProps) {
  const textComponent = new TextDisplayBuilder().setContent(
    '# <:lionpoliceroleplay:1292049154402549762> Lion Police Roleplay - Crosshair\n\n' +
      'Věděl jsi, že si přes F8 můžeš nastavit custom crosshair, který ti na serveru pomůže? Níže si přečti jak ho můžeš zapnout.\n\n' +
      '### 📌 Novinka — In-game příkaz\n' +
      'Nově si můžeš zobrazit tuto informaci přímo **ve hře** pomocí příkazu `/crosshair` v chatu!\n\n' +
      '### 🎯 Zapnutí Crosshairu\n' +
      'Vložte do konzole například:\n' +
      '```\ncl_customcrosshair 1; cl_crosshairstyle 5; cl_crosshairsize 2.0; cl_crosshair_drawoutline 1; cl_crosshairthickness 0.7; cl_crosshair_outlinethickness 0.3; cl_crosshairdot 0; cl_crosshairgap -2; cl_crosshaircolor 5; cl_crosshaircolor_r 255; cl_crosshaircolor_g 255; cl_crosshaircolor_b 255;\n```\n' +
      'V případě, že chcete mít crosshair jiný, upravte si ho podle svých potřeb.\n\n' +
      '### ⚙️ Úprava Crosshairu\n' +
      'Upravit si crosshair můžete podle hodnot, které jsou vypsané. Konkrétní info ohledně crosshairu najdete v dokumentaci.\n\n' +
      '### 🎯 Vypnutí Crosshairu\n' +
      'Vypnout ho můžete pomocí:\n' +
      '```\ncl_customcrosshair 0\n```',
  );

  const button = new ButtonBuilder()
    .setLabel('⚙️ Cfx.re Docs')
    .setStyle(ButtonStyle.Link)
    .setURL('https://docs.fivem.net/docs/client-manual/crosshair/');

  const thumbnailComponent = new ThumbnailBuilder({
    media: {
      url: 'https://cdn.discordapp.com/emojis/1292049154402549762.png',
    },
  });

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
  userPermissions: [],
  botPermissions: [],
  deleted: false,
};
