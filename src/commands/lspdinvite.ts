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
  name: 'lspdinvite',
  description: 'Získej pozvánku na Discord server LSPD!',
  integration_types: [1],
  contexts: [1, 2],
};

export function run({ interaction, client, handler }: SlashCommandProps) {
  const inviteLink = 'https://discord.gg/mf4pjDRgqe';

  const textComponent = new TextDisplayBuilder().setContent(
    '# 👮‍♂️ Pozvánka na LSPD Discord\n\n\nPřipoj se na Discord pomocí tlačítka níže. Dále postupuj podle instrukcí osoby, které Vás nabírá.\n\n**🔗 Další odkazy**\n[Lion Police RP - Discord](https://discord.gg/rrZ7RpEUkb) | [Guide](https://guide.lionsproject.eu/)',
  );

  const button = new ButtonBuilder()
    .setLabel('👮 Připojit se na LSPD Discord')
    .setStyle(ButtonStyle.Link)
    .setURL(inviteLink);

  const thumbnailComponent = new ThumbnailBuilder({
    media: {
      url: 'https://cdn.discordapp.com/attachments/1287133753356980329/1369380612921757766/LSPD1.png?ex=681ba693&is=681a5513&hm=e5d493a0352789095ff08c699f2c24f3617b51e9cccbf8bd4cf93639e9a1d54a&',
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
