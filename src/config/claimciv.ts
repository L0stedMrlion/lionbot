export interface ClaimCivRoleGroup {
  roleId: string;
  group: string | null;
}

export const claimCivRoleGroups: readonly ClaimCivRoleGroup[] = [
  // Examples: replace the placeholder Discord role IDs and group names.
  // { roleId: 'DISCORD_ROLE_ID_HIGHER', group: 'civ_senior' },
  // { roleId: 'DISCORD_ROLE_ID_STANDARD', group: 'civ' },

  // Existing civilian role: preserve the current in-game default until configured.
  { roleId: '1375531258871939153', group: "civ" },
];
