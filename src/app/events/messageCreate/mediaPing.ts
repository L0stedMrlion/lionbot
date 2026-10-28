import type { EventHandler } from 'commandkit';

const SOURCE_BOT_ID = '1560980718765613146';
const TARGET_CHANNEL_ID = '1534850406394495101';
const MEDIA_ROLE_ID = '1563861544394039417';

const handler: EventHandler<'messageCreate'> = async (message) => {
  if (message.author.id !== SOURCE_BOT_ID || message.channelId !== TARGET_CHANNEL_ID) return;
  if (!message.inGuild() || !message.channel.isSendable()) return;

  try {
    await message.channel.send({
      content: `<@&${MEDIA_ROLE_ID}>, vyšlo nové video! Klikněte na link výše a zhlédněte ho.`,
      allowedMentions: { parse: [], roles: [MEDIA_ROLE_ID] },
    });
  } catch (error) {
    console.error('[MediaPing] Failed to send video notification:', error);
  }
};

export default handler;
