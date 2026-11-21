import type { EventHandler } from 'commandkit';
import { startCivSync } from '../../../services/civSync';

const handler: EventHandler<'clientReady'> = (client) => {
  startCivSync(client);
};

export default handler;
