export interface School {
  id: string;
  name: string;
}

export interface OfficiatingOrg {
  id: string;
  associationId: string;
  name: string;
}

export interface Association {
  id: string;
  name: string;
  stateCode: string;
}

export interface Official {
  id: string;
  firstName: string;
  lastName: string;
  orgId: string;
  associationId: string;
  /** An assigner is looking for the best player available. */
  rank: 'A' | 'B';
}

export interface Game {
  id: string;
  homeSchoolId: string;
  awaySchoolId: string;
  sport: string;
  level: string;
  seasonYear: number;
  startsAt: string;
  /** How many officials the game needs before it is fully staffed. */
  crewSize: number;
  positions: string[];
  /** The local officiating organisation responsible for the game. */
  orgId: string;
}

/**
 * The platform blocks an official for a flat three hours around a
 * kickoff, on the assumption that the longest football game runs three
 * hours. Two games inside one block are a conflict.
 */
export const BLOCK_HOURS = 3;

export function overlaps(a: Game, b: Game): boolean {
  const gap = Math.abs(Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return gap < BLOCK_HOURS * 60 * 60 * 1000;
}
