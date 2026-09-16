/**
 * The lifecycle an assignment moves through.
 *
 * An assignment starts at Offered when the assigner puts a game in
 * front of an official. Paid is terminal: the official worked the game
 * and the fee went out.
 */
export const STAGES = [
  'Offered',
  'Accepted',
  'Confirmed',
  'Worked',
  'Paid',
] as const;

export type Stage = (typeof STAGES)[number];

/** The terminal stage. An assignment here is closed. */
export const TERMINAL_STAGE: Stage = 'Paid';

/** Stages where the official is committed to the game. */
export const COMMITTED_STAGES: readonly Stage[] = [
  'Accepted',
  'Confirmed',
  'Worked',
  'Paid',
];

export function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

export function isCommitted(stage: Stage): boolean {
  return COMMITTED_STAGES.includes(stage);
}

/** The next stage in the lifecycle, or null if the assignment is closed. */
export function nextStage(stage: Stage): Stage | null {
  switch (stage) {
    case 'Offered':
      return 'Accepted';
    case 'Accepted':
      return 'Confirmed';
    case 'Confirmed':
      return 'Worked';
    case 'Worked':
      return 'Paid';
    case 'Paid':
      return null;
  }
}
