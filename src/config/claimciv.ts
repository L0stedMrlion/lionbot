export interface ClaimCivRoleGroup {
  roleId: string;
  group: string | null;
}

export const claimCivRoleGroups: readonly ClaimCivRoleGroup[] = [
  { roleId: '1571431704248320050', group: "civ_exp" },
  { roleId: '1375531258871939153', group: "civ" },
  { roleId: '1571431626741776395', group: "civ_beg" },
];
