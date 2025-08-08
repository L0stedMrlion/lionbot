const fs = require("fs");
const path = require("path");
const {
  MessageFlags,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SectionBuilder,
} = require("discord.js");

module.exports = {
  data: {
    name: "rpprompt",
    description: "Generates RP action idea for you!",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
  },
  run: async ({ interaction, client, handler }) => {
    try {
      const filePath = path.join(__dirname, "..", "txt", "prompts.txt");
      const fileContent = fs.readFileSync(filePath, "utf8");

      let lines = fileContent.split("\n").filter((line) => line.trim() !== "");

      if (lines.length === 0) {
        return interaction.reply({
          content: "❌ No prompts found in the file!",
          ephemeral: true,
        });
      }

      const randomIndex = Math.floor(Math.random() * lines.length);
      const randomPrompt = lines[randomIndex];

      const numberofprompts = fileContent
        .split("\n")
        .filter((line) => line.trim() !== "");

      const textComponent = new TextDisplayBuilder().setContent(
        `# 🎭 RP Prompt\n\nAhoj! Vygeneroval jsem ti náhodný návrh na akci\n\n**${randomPrompt}**\nPokud se ti tento návrh nehodí, zkus příkaz \`/rpprompt\` znovu pro nový návrh. Momentálně obsahuju **${numberofprompts.length}** unikatních promptů!`
      );

      const thumbnailComponent = new ThumbnailBuilder({
        media: {
          url: "https://cdn.discordapp.com/attachments/1287133753356980329/1383724242142494740/performing-arts_1f3ad.png?ex=684fd51f&is=684e839f&hm=e1b9d84a09af66486598686450bd65950a5952c6adc0dbaf65dfb38e4ba9ed23&",
        },
      });

      const sectionComponent = new SectionBuilder()
        .addTextDisplayComponents(textComponent)
        .setThumbnailAccessory(thumbnailComponent);

      interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [sectionComponent],
      });
    } catch (err) {
      console.error("Error reading prompts.txt:", err);
      return interaction.reply({
        content: "⚠️ An error occurred while generating the prompt.",
        ephemeral: true,
      });
    }
  },
  options: {
    devOnly: false,
    userPermissions: ["SendMessages"],
    botPermissions: ["SendMessages", "EmbedLinks"],
    deleted: false,
  },
};
