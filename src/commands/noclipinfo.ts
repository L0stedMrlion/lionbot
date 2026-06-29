import {
  ApplicationCommandOptionType,
  MessageFlags,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from 'discord.js';
import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';

export const data: CommandData = {
  name: 'noclipinfo',
  description: 'Sends message to a user about their no-clip feature access',
  options: [
    {
      name: 'user',
      description: 'User that gets that DM',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
};

const ALLOWED_USER_IDS = [
  '710549603216261141',
  '769892516152999957',
  '735501561819824218',
  '432501487361327114',
];

export async function run({ interaction }: SlashCommandProps) {
  if (!ALLOWED_USER_IDS.includes(interaction.user.id)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const targetUser = interaction.options.getUser('user', true);

  try {
    const thumbnailComponent = new ThumbnailBuilder({
      media: {
        url: 'https://r2.fivemanage.com/zlqBQerSIEakQVh7POEZe/policelogo.png',
      },
    });

    const titleText = new TextDisplayBuilder().setContent(
      '# 🦅 LION POLICE ROLEPLAY - NO-CLIP Feature',
    );

    const bodyText = new TextDisplayBuilder().setContent(
      'Zdravím,\n\n' +
        'aktuálně ti byla umožněna feature na **no-clip pro civy**. Používáním souhlasíš s pravidly, které jsou sepsány na Guide.\n' +
        '👉 [Klikni zde pro zobrazení pravidel](https://guide.lionsproject.eu/civilian#no-clip)\n\n' +
        '⚠️ **Zneužití je PŘÍSNĚ TRESTÁNO!**\n\n' +
        '### ⚙️ Nastavení bindu:\n' +
        'Zapnutí no-clipu si musíte nabindovat přes:\n' +
        '> Settings -> Keybindings -> FiveM -> (lion_utilities) Toggle no-clip // *Prázdný bind, něco tam dáte.*\n\n' +
        'V případě dotazů se neváhejte zeptat.\n\n' +
        'Pro refresh pár dejte **/refreshperms** na nějakém z Vašich civilian charakterů a vše by mělo začít fungovat. V případě problémů si založte ticket.\n'+
        'Hezký den,\n' +
        `<@${interaction.user.id}>`,
    );

    const sectionComponent = new SectionBuilder()
      .addTextDisplayComponents(titleText, bodyText)
      .setThumbnailAccessory(thumbnailComponent);

    const separator = new SeparatorBuilder().setSpacing(
      SeparatorSpacingSize.Small,
    );

    const senderText = new TextDisplayBuilder().setContent(
      `👤 **Tuto zprávu odeslal:** <@${interaction.user.id}>`,
    );

    await targetUser.send({
      flags: MessageFlags.IsComponentsV2,
      components: [sectionComponent, separator, senderText],
    });

    await interaction.reply({
      content: `✅ Zpráva o no-clipu byla úspěšně odeslána uživateli <@${targetUser.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error('Failed to send DM:', error);
    await interaction.reply({
      content: `❌ Nepodařilo se odeslat DM uživateli <@${targetUser.id}>. Je možné, že má vypnuté DMs.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

export const options: CommandOptions = {
  devOnly: false,
  userPermissions: [],
  botPermissions: [],
  deleted: false,
};
