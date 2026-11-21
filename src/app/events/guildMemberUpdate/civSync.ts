import type { EventHandler } from 'commandkit';
import { claimCivRoleGroups } from '../../../config/claimciv';
import { civSyncGuildId, syncMember } from '../../../services/civSync';

const handler: EventHandler<'guildMemberUpdate'> = async (oldMember, newMember) => {
  if (newMember.guild.id !== civSyncGuildId) return;
  const changed = claimCivRoleGroups.some(({ roleId }) => oldMember.roles.cache.has(roleId) !== newMember.roles.cache.has(roleId));
  if (!changed) return;
  try {
    await syncMember(newMember);
  } catch (error) {
    console.error(`[civSync] Role update failed for ${newMember.id}:`, error);
  }
};

export default handler;
