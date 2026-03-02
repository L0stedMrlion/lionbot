import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';
import { EmbedBuilder } from 'discord.js';

export const data: CommandData = {
  name: 'crosshair',
  description: 'Sends informations about crosshair',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export function run({ interaction, client, handler }: SlashCommandProps) {
  const embed = new EmbedBuilder()
    .setTitle(
      '<:lionpoliceroleplay:1292049154402549762> Lion Police Roleplay - Crosshair',
    )
    .setDescription(
      'Věděl jsi, že si přes F8 můžeš nastavit custom crosshair, který ti na serveru pomůže? Níže si přečti jak ho můžeš zapnout.',
    )
    .setColor('#ffb500')
    .addFields(
      {
        name: '📌 Novinka — In-game příkaz',
        value:
          'Nově si můžeš zobrazit tuto informaci přímo **ve hře** pomocí příkazu `/crosshair` v chatu!',
      },
      {
        name: '🎯 Zapnutí Crosshairu',
        value:
          'Vložte do konzole například \n```cl_customcrosshair 1; cl_crosshairstyle 5; cl_crosshairsize 2.0; cl_crosshair_drawoutline 1; cl_crosshairthickness 0.7; cl_crosshair_outlinethickness 0.3; cl_crosshairdot 0; cl_crosshairgap -2; cl_crosshaircolor 5; cl_crosshaircolor_r 255; cl_crosshaircolor_g 255; cl_crosshaircolor_b 255;```\n V případě, že chcete mít crosshair jiný, upravte si ho podle svých potřeb. \n\n||Jedná se o crosshair config od <@710549603216261141>.||',
      },
      {
        name: '⚙️ Úprava Crosshairu',
        value:
          'Upravit si crosshair můžete podle hodnot, které jsou vypsané. Konkrétní info ohledně crosshairu najdete na [Cfx.re Docs](https://docs.fivem.net/docs/client-manual/crosshair/).',
      },
      {
        name: '🎯 Vypnutí Crosshairu',
        value: 'Vypnout ho můžete pomocí \n ```cl_customcrosshair 0```',
      },
    )
    .setFooter({
      text: '🦁 Lion Police Roleplay',
    });

  interaction.reply({ embeds: [embed] });
}

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
};
