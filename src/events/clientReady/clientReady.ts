import { ActivityType, Client } from 'discord.js';

export const once = true;
export const event = 'clientReady';

export default function (client: Client) {
  console.log(`✅ ${client.user?.tag} is online.`);
  client.user?.setActivity({
    name: '🦁 Lion Police Roleplay',
    type: ActivityType.Playing,
  });
}
