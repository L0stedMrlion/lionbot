const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "lionpolicerp",
    description: "Sends Discord link for Lion Police Roleplay",
    integration_types: [1],
    contexts: [0, 1, 2],
  },

  run: ({ interaction, client, handler }) => {
    const embed = new EmbedBuilder()
      .setTitle("<:lionpoliceroleplay:1292049154402549762> Lion Police Roleplay")
      .setDescription(
        "Jsme rádi, že jste se chcete k nám kouknout! Podívejte se níže co u nás najdete."
      )
      .setColor("#ffb500")
      .addFields(
        {
          name: "👋 O nás",
          value:
            "Lion Police Roleplay je český server, který se zaměřuje na Police RP, RPí se u nás LSPD stylem. Pro více informací se připoj na náš Discord.",
        },
        {
          name: "📚 Pravidla",
          value:
            "Všechny pravidla najdete na naší [guide](https://guide.lionsproject.eu/), v případě dotazů se připojte na Discordu.",
        },
        {
          name: "🎮 Jak se připojit na Lion?",
          value:
            "Pro připojení na FiveM server použijte příkaz `/jaksepripojit` na našem Discordu!",
        },
        {
          name: "💬 Podpora",
          value:
            "Potřebujete pomoc? Připojte se na náš Discord a založte si tam ticket a budeme se Vám věnovat co nejdříve :heart:",
        },
        {
          name: "🔗 Užitečné odkazy",
          value:
            "[Discord](https://discord.gg/rrZ7RpEUkb) | [Guide](https://guide.lionsproject.eu/) | [Přispějte nám (Paypal)](https://www.paypal.com/paypalme/lostedmrlion)",
        }
      )
      .setFooter({
        text: "🦁 Lion Police Roleplay | Roleplay.lionsproject.eu",
      });

    interaction.reply({ embeds: [embed] });
  },

  options: {
    devOnly: false,
    userPermissions: ["Administrator", "AddReactions"],
    botPermissions: ["Administrator", "AddReactions"],
    deleted: false,
  },
};
