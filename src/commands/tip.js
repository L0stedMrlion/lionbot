const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "paypal",
    description: "Sends link for Lions paypal for donations!",
    integration_types: [1],
    contexts: [1, 2],
  },

  run: ({ interaction, client, handler }) => {
    const embed = new EmbedBuilder()
      .setTitle("💰 Chceš nás podpořit?")
      .setColor("#ffb500")
      .addFields(
        {
          name: "💎 Jak podpořit?",
          value:
            "Navštiv náš projektový [paypal](https://www.paypal.com/paypalme/lostedmrlion), tam můžeš poslat libovolnou částku.",
        },
        {
          name: "❓ Nemáš paypal a chceš použít jinou metodu?",
          value:
            "Založ si ticket na našem projektovém Discordu a domluvíme se tam, bereme skoro všechny platební metody.",
        }
      )
      .setFooter({ text: "🦁 Lion Police Roleplay | Děkujeme za podporu!" });

    interaction.reply({ embeds: [embed] });
  },

  options: {
    devOnly: false,
    userPermissions: ["Administrator", "AddReactions"],
    botPermissions: ["Administrator", "AddReactions"],
    deleted: false,
  },
};
