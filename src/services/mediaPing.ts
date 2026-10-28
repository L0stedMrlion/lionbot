import { Client, Events } from 'discord.js';

const SOURCE_BOT_ID = '1560980718765613146';
const TARGET_CHANNEL_ID = '1534850406394495101';
const MEDIA_ROLE_ID = '1563861544394039417';

export function initializeMediaPing(client: Client) {
  client.on(Events.MessageCreate, async (message) => {
    if (message.channelId !== TARGET_CHANNEL_ID || message.author.id !== SOURCE_BOT_ID) return;

    try {
      await message.channel.send({
        content: `<@&${MEDIA_ROLE_ID}>, vyšlo nové video! Klikněte na link výše a zhlédněte ho.`,
        allowedMentions: { parse: [], roles: [MEDIA_ROLE_ID] },
      });
    } catch (error) {
      console.error('[MediaPing] Failed to send video notification:', error);
    }
  });
}
