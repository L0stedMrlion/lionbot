const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "shop",
    description: "Sends information about buying things",
    integration_types: [1],
    contexts: [0, 1, 2],
  },

  run: ({ interaction, client, handler }) => {
    const firstEmbed = new EmbedBuilder()
      .setTitle("🦁 Lion Police Roleplay - Shop")
      .setDescription(
        "Níže najdete nabídku věci, které si můžete na našem server koupit."
      )
      .setColor("#ffb500")
      .setImage(
        "https://cdn.discordapp.com/attachments/1287133753356980329/1365334149056954528/ems.png?ex=680cee03&is=680b9c83&hm=1131db000e18432be55f8f6cf26fe8413e68649afbba114284d4ff25697275f1&"
      )
      .setFooter({ text: "🦁 Lion Police Roleplay" })
      .addFields({
        name: "🚑 EMS ",
        value:
          "U nás na serveru umožnujeme RPit EMS. Za peníze je to z důvodu, že EMS jsou v beta verzi a nechceme, aby k tomu měl přístup každý.\n\n Cena: 500 Kč\n\n Myslete, že peníze jdou na rozvoj projektu. V případě, že si toto chcete zakoupit otevřete si ticket -> https://discord.com/channels/1286329202723000431/1296470302682779648.",
      });

    const secondEmbed = new EmbedBuilder()
      .setColor("#ffb500")
      .setImage(
        "https://cdn.discordapp.com/attachments/1287133753356980329/1365334150093213808/salieru.png?ex=680cee04&is=680b9c84&hm=ecfea784ff504367d71d06c35d615d262264068798b7b0072386f8e69fc97036&"
      )
      .addFields({
        name: "🍾 Salieri Bar",
        value:
          "Chceš u nás na serveru RPit legální frakci? Pokud si zakoupíš Salieri Bar tak můžeš pracovat v Salieri Baru.\n\n Cena: 300 Kč\n\n Myslete, že peníze jdou na rozvoj projektu. V případě, že si toto chcete zakoupit otevřete si ticket -> https://discord.com/channels/1286329202723000431/1296470302682779648.",
      })
      .setFooter({
        text: "🦁 Lion Police Roleplay",
      });

    interaction.reply({ embeds: [firstEmbed, secondEmbed] });
  },

  options: {
    devOnly: false,
    userPermissions: ["Administrator", "AddReactions"],
    botPermissions: ["Administrator", "AddReactions"],
    deleted: false,
  },
};
