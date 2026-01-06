import {
  GuildMember,
  MessageFlags,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  ThumbnailBuilder,
  SectionBuilder,
  ActionRowBuilder,
} from 'discord.js';

export default async function (member: GuildMember) {
  const inviteLink =
    'https://discord.com/channels/1286329202723000431/1420791609481756672';

  const ticketLink =
    'https://discord.com/channels/1286329202723000431/1420791609481756672';

  const textComponent = new TextDisplayBuilder().setContent(
    '# 🦁 Lion Police Roleplay\n\n## ℹ️ **O projektu**\nLion Police Roleplay je RP server zaměřený na **Police RP** s konceptem **PD vs Civilians**.\n\n🔒 **RP mohou dělat pouze Verified Civilisté** s rolí na Discordu. Civilisté mají téměř **neomezené možnosti** (auta, zbraně, vybavení) pro tvorbu kvalitního RP.\n\n🚨 **DŮLEŽITÉ:** Pokud **nemáš roli Verified Civilian** a **ukradneš vozidlo nebo provedeš jiný čin bez RP**, můžeš **okamžitě dostat ban**.\n\n## 👮 Jak začít jako nováček\nVytvoř si postavu s **americkým jménem** a **formálním oblečením**. Po vytvoření se objevíš u recepce – vejdi dovnitř a **zavolej recepci** pomocí targetu na **NPC**.\n\nPoté vyčkej, než se ti bude věnovat **vyšší hodnost**. Pokud není momentálně dostupná, kontaktuj ji přes Discord (DMs). Ber prosím v potaz, že na serveru často probíhají aktivní RP akce a reakce nemusí být okamžitá.\n\n### 🆘 V případě dotazů a nebo jakékoliv pomoci\n👉 https://discord.com/channels/1286329202723000431/1296470302682779648',
  );

  const button = new ButtonBuilder()
    .setLabel('👮 Zobrazit informace ohledně LSPD náboru')
    .setStyle(ButtonStyle.Link)
    .setURL(inviteLink);

  const button2 = new ButtonBuilder()
    .setLabel('🎫 Tickets (Support)')
    .setStyle(ButtonStyle.Link)
    .setURL(ticketLink);

  const thumbnailComponent = new ThumbnailBuilder({
    media: {
      url: 'https://cdn.discordapp.com/attachments/1287133753356980329/1453454984019578900/policelogo.png?ex=695ea670&is=695d54f0&hm=01e1a83a16ebede92af6546ad13c394e4b0b70d107f53c785eaa6caf0d8a7f0b&',
    },
  });

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    button,
    button2,
  );

  const sectionComponent = new SectionBuilder()
    .addTextDisplayComponents(textComponent)
    .setThumbnailAccessory(thumbnailComponent);

  try {
    await member.send({
      flags: MessageFlags.IsComponentsV2,
      components: [sectionComponent, actionRow],
    });

    console.log(`✅ Welcome DM sent to ${member.user.tag}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome DM to ${member.user.tag}:`, error);
  }
}
