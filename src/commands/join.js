const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "jaksepripojit",
    description: "Sends instruction how connect!",
    integration_types: [1],
    contexts: [0, 1, 2],
  },

  run: ({ interaction, client, handler }) => {
    const embed = new EmbedBuilder()
      .setTitle("🦁 Jak se připojit na náš server?")
      .setDescription("Pro připojení následujte níže sepsané kroky")
      .setColor("#ffb500")
      .addFields(
        {
          name: "1️⃣ První krok",
          value: "Otevři aplikaci FiveM",
        },
        {
          name: "2️⃣ Druhý krok",
          value: "Dej F8 pro otevření konzole",
        },
        {
          name: "3️⃣ Třetí krok",
          value: "Do konzole vlož: `connect roleplay.lionsproject.eu`",
        },
        {
          name: "4️⃣ Čtvrtý krok",
          value: "Počkej na dokončení připojení a načtení serveru",
        },
        { name: "5️⃣ Pátý krok", value: "Vytvoř si postavu a užij si hru!" }
      )
      .setFooter({ text: "🦁 Lion Police Roleplay" });

    interaction.reply({ embeds: [embed] });
  },

  options: {
    devOnly: false,
    userPermissions: ["Administrator", "AddReactions"],
    botPermissions: ["Administrator", "AddReactions"],
    deleted: false,
  },
};
