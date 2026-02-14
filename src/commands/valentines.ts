import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';

const ALLOWED_USER_IDS = ['710549603216261141'];

export const data: CommandData = {
  name: 'valentines',
  description:
    "Send a beautiful Valentine's Day message to someone special! ❤️",
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'user',
      description: 'The person you want to send the message to',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'author',
      description: 'Author of the message',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'message',
      description: 'Your sweet message',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};

export async function run({ interaction }: SlashCommandProps) {
  if (!ALLOWED_USER_IDS.includes(interaction.user.id)) {
    return interaction.reply({
      content: `❌ Tato Valentýnská kouzla může používat pouze vyvolený! ❤️\n*(Tvůj ID: ${interaction.user.id})*`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const targetUser = interaction.options.getUser('user', true);
  const message = interaction.options.getString('message', true);
  const author = interaction.options.getString('author', true);

  const valentineEmbed = new EmbedBuilder()
    .setColor('#FF0033')
    .setTitle('💖 **LION POLICE VALENTÝNKA** 💖')
    .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
    .setDescription(
      `### 🌹 Speciální vzkaz pro tebe!\n\n` +
        `> "${message}"\n\n` +
        `💌 *Tato zpráva byla doručena speciálním Valentýnským kurýrem.*`,
    )
    .addFields({
      name: ' ✨ Podrobnosti',
      value: `✍️ **Odesílatel:** ${author}`,
      inline: true,
    })
    .setImage('https://media.tenor.com/rKwbzH0ts-IAAAAd/byuntear-snoopy.gif')
    .setFooter({
      text: "🦁 Lion Police Roleplay - Valentine's Day 2026 EVENT",
      iconURL: interaction.client.user?.displayAvatarURL(),
    })
    .setTimestamp();

  try {
    // We send the DM first
    await targetUser.send({
      embeds: [valentineEmbed],
    });

    // Then we reply directly (no defer/edit)
    // This is faster and avoids the 3-second timeout if the DM took long
    return interaction.reply({
      content: `✅ Valentýnka byla úspěšně doručena uživateli ${targetUser.tag} do soukromých zpráv! ❤️`,
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error('Error sending Valentine DM:', error);
    return interaction.reply({
      content: `❌ Nepodařilo se doručit Valentýnku uživateli ${targetUser.tag}. (Pravděpodobně má vypnuté DMs)`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
};
