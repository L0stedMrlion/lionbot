const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "binding",
    description: "Sends informations about binding for FiveM",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
  },

  run: ({ interaction, client, handler }) => {
    const embed = new EmbedBuilder()
      .setTitle("<:lionpoliceroleplay:1292049154402549762> Lion Police Roleplay - Binding")
      .setDescription(
        "Bindovat si věci na určité klávesy je občas jednoduše, naopak občas složité, níže máte sepsáno jak se binduje přes F8."
      )
      .setColor("#ffb500")
      .addFields(
        {
          name: "⌨️ Vytvoření bindu",
          value:
            'Otevřete konzoli F8 a zadejte: ```bind keyboard <key> "e whistle"```\nPro nastavení bindů na jednu klávesu použijte: ```bind keyboard <key> "e whistle; e sit; panic"```',
        },
        {
          name: "⌨️ Odstranění bindu",
          value: "Otevřete konzoli F8 a zadejte: ```unbind keyboard <key>```",
        },
        {
          name: "🔑 Key",
          value:
            "Vždy <key> nahradte nějakou klávesou, všechny jsou vypsané [zde](https://docs.fivem.net/docs/game-references/input-mapper-parameter-ids/keyboard/).",
        }
      )
      .setFooter({
        text: "🦁 Lion Police Roleplay",
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
