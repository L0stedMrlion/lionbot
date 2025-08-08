const { EmbedBuilder, MessageFlags } = require("discord.js");

const AUTHORIZED_USER_IDS = [
  "769892516152999957", // petrpetr
  "710549603216261141", // Mrlion
];

module.exports = {
  data: {
    name: "managementinfo",
    description: "Sends informations about Lion Police RP, only for management",
    integration_types: [1],
    contexts: [0, 1, 2],
  },
  run: async ({ interaction, client, handler }) => {
    if (!AUTHORIZED_USER_IDS.includes(interaction.user.id)) {
      return interaction.reply({
        content: "🔒 You are not authorized to use this command.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const managementEmbed = new EmbedBuilder()
      .setColor("#ffb500")
      .setTitle("🦁 Lion Police RP - Management Informations")
      .setDescription("This is confidential information for management only.")
      .addFields(
        {
          name: "Admin groups",
          value:
            "\n- Usage: `setgroup <id> <group>`\n\n" +
            "**Available groups:**\n" +
            "- `administrator` - Access to reports, reviews, and standard staff functions\n" +
            "- `civ` - Basic civilian access only\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        },
        {
          name: "Item spawncodes",
          value:
            "\n- Usage: `giveitem <id/me> <item.name> <count>`\n\n" +
            "**Listed Items:**\n" +
            "- `bomb_suitcase` - Bomb (For RP)\n" +
            "- `okokphone` - Telephone\n" +
            "- `identification` - ID Card\n" +
            "- `WEAPON_BBSHOTGUN` - Beanbag shotgun\n" +
            "- `WEAPON_CARBINERIFLE_MK2` - Carbine Rifle\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        },
        {
          name: "Commands",
          value:
            "- `/fix <id/me>` - For fixing vehicle\n" +
            "- `/revive <id/me>` - For reviving players\n" +
            "- `/reports` - Opens menu for reports\n" +
            "- `/contract` - For giving contract for vehicle transfer\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        }
      )
      .setFooter({ text: "🦁 Lion Police Roleplay" });

    await interaction.reply({
      embeds: [managementEmbed],
      flags: MessageFlags.Ephemeral,
    });
  },
  options: {
    devOnly: false,
    botPermissions: ["Administrator"],
    deleted: false,
  },
};
