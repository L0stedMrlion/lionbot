import {
  ApplicationCommandOptionType,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';

export const data: CommandData = {
  name: 'vyhodnocenicivnabor',
  description: 'Sends message about their status of civilian recruitment',
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
    const embed = new EmbedBuilder()
      .setTitle('🟩 LION POLICE ROLEPLAY - CIVILIAN NÁBOR 🟩')
      .setThumbnail(
        'https://cdn.discordapp.com/attachments/1287133753356980329/1455720760088592476/lion_civ_logo.png?ex=69a8b1ec&is=69a7606c&hm=a108a945d8b2d4957e8ced9629b36d0e80718d09873fc4242634fd6e8c760a9f&',
      )
      .setDescription(
        '### 📄 Oficiální vyrozumění o výsledku náboru\n\n' +
          '> S velkým potěšením Vám oznamujeme, že Vaše přihláška byla vyhodnocena kladně a byl jsi **PŘIJAT** ✅! 🎉\n\n' +
          'Nyní tě čeká **vstupní pohovor**. Veškeré podrobnosti a instrukce, jak dále postupovat, nalezneš v **připnuté zprávě** v kanále níže:\n\n' +
          '✨ **Odkaz na kanál, kde zjistíš více**\n' +
          '👉 [Klikni zde pro přejití do kanálu](https://discord.com/channels/1286329202723000431/1478530846544625704)\n\n' +
          '🎊 **Gratulujeme!**\n' +
          'Těšíme se na tvé budoucí působení v našem týmu a na tvé RP!\n',
      )
      .addFields({
        name: '👤 Tuto zprávu odeslal:',
        value: `<@${interaction.user.id}>`,
        inline: true,
      })
      .setImage('https://media.tenor.com/xDHCe07zrocAAAAC/congrats-minions.gif')
      .setColor(0x256d25)
      .setFooter({
        text: '🦁 Lion Police Roleplay - Civilian Nábor',
        iconURL:
          'https://cdn.discordapp.com/attachments/1287133753356980329/1453454984019578900/policelogo.png?ex=69a87a70&is=69a728f0&hm=75e41e20539bf8af48602f2cfc52e99cefc868fc1b90ff7c37dcfcd1e4968036&',
      })
      .setTimestamp();

    await targetUser.send({
      embeds: [embed],
    });

    const GUILD_ID = '1286329202723000431';
    const ROLE_ID = '1478009779531022358';

    const guild = interaction.client.guilds.cache.get(GUILD_ID);
    let roleAdded = false;

    if (guild) {
      try {
        const member = await guild.members
          .fetch(targetUser.id)
          .catch(() => null);
        if (member) {
          await member.roles.add(ROLE_ID);
          roleAdded = true;
        }
      } catch (roleError) {
        console.error('Failed to assign role:', roleError);
      }
    }

    await interaction.reply({
      content:
        `✅ Zpráva o přijetí byla úspěšně odeslána uživateli <@${targetUser.id}>.\n` +
        (roleAdded
          ? `✅ Role <@&${ROLE_ID}> byla uživateli úspěšně přidělena.`
          : `⚠️ Roli se nepodařilo přidělit (uživatel možná není na serveru).`),
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
