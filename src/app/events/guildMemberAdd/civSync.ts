import type { EventHandler } from 'commandkit';
import { civSyncGuildId, syncMember } from '../../../services/civSync';

const handler: EventHandler<'guildMemberAdd'> = async (member) => {
  if (member.guild.id !== civSyncGuildId) return;
  try {
    await syncMember(member);
  } catch (error) {
    console.error(`[civSync] New member sync failed for ${member.id}:`, error);
  }
};

export default handler;
