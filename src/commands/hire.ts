import {
  ApplicationCommandOptionType,
  MessageFlags,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  ThumbnailBuilder,
  SectionBuilder,
  ActionRowBuilder,
  GuildMemberRoleManager,
} from 'discord.js';
import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';
import { readSheet, updateSheet } from '../utils/googleSheets';
import { config } from '../config';

const { spreadsheetId, badgeSheetName, mainSheetName } = config.googleSheets;

export const data: CommandData = {
  name: 'hire',
  description: 'Hire a member and update both Badge and Main sheets.',
  options: [
    {
      name: 'user',
      description: 'The Discord user being hired',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'ic-name',
      description: 'The IC Name for the record',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};

export async function run({ interaction }: SlashCommandProps) {
  const member = interaction.member;
  const hasRole = (
    member?.roles as GuildMemberRoleManager | undefined
  )?.cache.has(config.discord.roles.hireAllowed);
  const isCorrectGuild = interaction.guildId === config.discord.guilds.main;

  if (!isCorrectGuild || !hasRole) {
    return interaction.reply({
      content:
        '❌ You do not have permission to use this command (Required role/server missing).',
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetUser = interaction.options.getUser('user', true);
  const icName = interaction.options.getString('ic-name', true);
  const now = new Date();
  const date = `'${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;

  const inviteLink = 'https://discord.gg/mf4pjDRgqe';
  const textComponentInvite = new TextDisplayBuilder().setContent(
    '# 👮‍♂️ Pozvánka na LSPD Discord\n\n\nPřipoj se na Discord pomocí tlačítka níže. Dále postupuj podle instrukcí osoby, které Vás nabírá.\n\n**🔗 Další odkazy**\n[Lion Police RP - Discord](https://discord.gg/rrZ7RpEUkb) | [Guide](https://guide.lionsproject.eu/)',
  );

  const buttonInvite = new ButtonBuilder()
    .setLabel('👮 Připojit se na LSPD Discord')
    .setStyle(ButtonStyle.Link)
    .setURL(inviteLink);

  const thumbnailComponent = new ThumbnailBuilder({
    media: {
      url: 'https://cdn.discordapp.com/attachments/1287133753356980329/1369380612921757766/LSPD1.png?ex=681ba693&is=681a5513&hm=e5d493a0352789095ff08c699f2c24f3617b51e9cccbf8bd4cf93639e9a1d54a&',
    },
  });

  const actionRowInvite = new ActionRowBuilder<ButtonBuilder>().addComponents(
    buttonInvite,
  );

  const sectionComponentInvite = new SectionBuilder()
    .addTextDisplayComponents(textComponentInvite)
    .setThumbnailAccessory(thumbnailComponent);

  try {
    await targetUser.send({
      flags: MessageFlags.IsComponentsV2,
      components: [sectionComponentInvite, actionRowInvite],
    });
  } catch (dmError) {
    console.warn(`Could not send DM to ${targetUser.tag}:`, dmError);
  }

  try {
    if (!spreadsheetId) {
      return interaction.editReply(
        '❌ Spreadsheet ID is not configured in .env',
      );
    }

    const badgeRows = await readSheet(spreadsheetId, `${badgeSheetName}!G:J`);
    if (!badgeRows || badgeRows.length === 0) {
      return interaction.editReply(
        `❌ Could not read the Badge Sheet ("${badgeSheetName}").`,
      );
    }

    let badgeRowIndex = -1;
    let badgeFound = '';

    for (let i = 0; i < badgeRows.length; i++) {
      const badge = badgeRows[i][0];
      const h = badgeRows[i][1];
      const iCol = badgeRows[i][2];
      const j = badgeRows[i][3];
      if (
        badge &&
        (!h || h.trim() === '') &&
        (!iCol || iCol.trim() === '') &&
        (!j || j.trim() === '')
      ) {
        badgeRowIndex = i + 1;
        badgeFound = badge.toString();
        break;
      }
    }

    if (badgeRowIndex === -1) {
      return interaction.editReply(
        '❌ No empty badge slots found in the Badge Sheet.',
      );
    }

    const mainRows = await readSheet(
      spreadsheetId,
      `${mainSheetName}!A106:J185`,
    );
    if (!mainRows || mainRows.length === 0) {
      return interaction.editReply(
        `❌ Could not read the Main Sheet ("${mainSheetName}") at range A106:J185. Check the name!`,
      );
    }

    let mainRowIndex = -1;
    let callsign = '';
    let shiftInfo = '';

    for (let i = 0; i < mainRows.length; i++) {
      const b = mainRows[i][1];
      const c = mainRows[i][2];
      const d = mainRows[i][3];

      if (!b && !c && !d) {
        mainRowIndex = 106 + i;
        callsign = mainRows[i][0];
        shiftInfo = mainRows[i][6];
        break;
      }
    }

    if (mainRowIndex === -1) {
      return interaction.editReply(
        '❌ No free paths found in Main Sheet (Rows 106-185 where B, C, D are empty).',
      );
    }

    await updateSheet(
      spreadsheetId,
      `${badgeSheetName}!H${badgeRowIndex}:J${badgeRowIndex}`,
      [[icName, targetUser.username, date]],
    );

    await updateSheet(
      spreadsheetId,
      `${mainSheetName}!B${mainRowIndex}:E${mainRowIndex}`,
      [[badgeFound, icName, targetUser.username, true]],
    );

    await updateSheet(
      spreadsheetId,
      `${mainSheetName}!H${mainRowIndex}:J${mainRowIndex}`,
      [[true, true, date]],
    );

    const formattedCallsign = (callsign || 'N/A')
      .replace('Lincoln ', 'L-')
      .replace('Lincoln-', 'L-')
      .replace('Lincoln', 'L-');

    const textComponentSuccess = new TextDisplayBuilder().setContent(
      `# 👮‍♂️ New Officer Hired!\n\n` +
        `The records have been successfully updated in all of the sheets.\n\n` +
        `### 📋 Identification Details\n` +
        `> 🆔 **Callsign:** \`${callsign || 'N/A'}\`\n` +
        `> 🎖️ **Badge Number:** \`${badgeFound}\`\n` +
        `> 🕒 **Assigned Shift:** \`${shiftInfo || 'None assigned'}\`\n\n` +
        `### ⚡ Quick Copy\n` +
        `\`\`\`\n[${formattedCallsign}] ${icName} (${badgeFound})\n\`\`\`\n`,
    );

    const sectionSuccess = new SectionBuilder()
      .addTextDisplayComponents(textComponentSuccess)
      .setThumbnailAccessory(thumbnailComponent);

    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [sectionSuccess],
    });
  } catch (error: any) {
    console.error('Sheet Error:', error);
    await interaction.editReply(
      `❌ Failed to process Google Sheet request. Check if sheet names are correct.`,
    );
  }
}

export const options: CommandOptions = {
  devOnly: false,
  userPermissions: [],
  botPermissions: [],
  deleted: false,
};
