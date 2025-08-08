const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "links",
    description: "Sends list of links for Lion Police RP!",
    integration_types: [1],
    contexts: [0, 1, 2],
  },

  run: ({ interaction, client, handler }) => {
    const embed = new EmbedBuilder()
      .setTitle("🔗 Links - Lion Police Roleplay")
      .setDescription(
        "Zde najdeš rozcestník všech odkazů, které na Lionu využiješ."
      )
      .setColor("#808080")
      .addFields(
        {
          name: "🎙️ Discord",
          value:
            "Připoj se na náš Discord na kterém najdeš celou naši komunitu!",
        },
        {
          name: "📗 Guide",
          value:
            "Najdete tam pravidla a další důležité informace ohledně projektu.",
        },
        {
          name: "📚 Trello",
          value: "Sepsané plánované změny, nápady další...",
        },
        {
          name: "💰 Finanční podpora",
          value: "Pomož nám udržet server v chodu finančním příspěvkem.",
        }
      )
      .setFooter({
        text: "🦁 Lion Police Roleplay",
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Discord")
        .setURL("https://discord.gg/rrZ7RpEUkb")
        .setStyle(ButtonStyle.Link)
        .setEmoji("🎙️"),

      new ButtonBuilder()
        .setLabel("Guide")
        .setURL("https://guide.lionsproject.eu/")
        .setStyle(ButtonStyle.Link)
        .setEmoji("📗"),

      new ButtonBuilder()
        .setLabel("Trello")
        .setURL("https://trello.com/b/bVPT80jL/lion-police-rp-board")
        .setStyle(ButtonStyle.Link)
        .setEmoji("📚"),

      new ButtonBuilder()
        .setLabel("Podpoř nás")
        .setURL("https://www.paypal.com/paypalme/lostedmrlion")
        .setStyle(ButtonStyle.Link)
        .setEmoji("💰")
    );

    interaction.reply({ embeds: [embed], components: [row] });
  },

  options: {
    devOnly: false,
    userPermissions: ["Administrator", "AddReactions"],
    botPermissions: ["Administrator", "AddReactions"],
    deleted: false,
  },
};
