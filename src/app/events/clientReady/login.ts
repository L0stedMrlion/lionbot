import type { EventHandler } from 'commandkit';

const handler: EventHandler<'clientReady'> = () => {
  console.log('✅ Discord bot logged in');
};

export default handler;
