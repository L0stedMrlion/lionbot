import type { EventHandler } from 'commandkit';
import { civSyncGuildId, syncRemovedMember } from '../../../services/civSync';

const handler: EventHandler<'guildMemberRemove'> = async (member) => {
  if (member.guild.id !== civSyncGuildId) return;
  try {
    await syncRemovedMember(member.id, member.user);
  } catch (error) {
    console.error(`[civSync] Member removal failed for ${member.id}:`, error);
  }
};

export default handler;
