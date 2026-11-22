import type { EventHandler } from 'commandkit';
import { civSyncGuildId, scheduleCivRoleSync } from '../../../services/civSync';

const handler: EventHandler<'guildMemberAdd'> = async (member) => {
  if (member.guild.id !== civSyncGuildId) return;
  scheduleCivRoleSync(member);
};

export default handler;
