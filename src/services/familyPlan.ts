import { IUser } from "../types";

export type OwnerExitPlan = {
  shouldDeleteFamily: boolean;
  nextOwnerId: string | null;
};

/**
 * Determines owner-exit transition plan from current member list.
 */
export const planOwnerExit = (ownerId: string, members: IUser[]): OwnerExitPlan => {
  const remainingMembers = members.filter((member) => member.uid !== ownerId);
  if (remainingMembers.length === 0) {
    return { shouldDeleteFamily: true, nextOwnerId: null };
  }
  return { shouldDeleteFamily: false, nextOwnerId: remainingMembers[0].uid };
};
