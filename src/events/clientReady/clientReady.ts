import { ActivityType, Client } from 'discord.js';
import { updateServerStats, updateDutyTimeStats } from '../../utils/stats';
import { checkDatabaseConnection } from '../../utils/database';

export const once = true;
export const event = 'clientReady';

export default async function (client: Client) {
  console.log(`✅ ${client.user?.tag} is online.`);
  client.user?.setActivity({
    name: '🦁 Lion Police Roleplay',
    type: ActivityType.Playing,
  });

  await checkDatabaseConnection();

  console.log('🤖 Updating stats...');
  await updateServerStats(client);
  await updateDutyTimeStats(client);

  setInterval(() => updateServerStats(client), 330000);
  setInterval(() => updateDutyTimeStats(client), 1200000);
}
