import { STAGES, type Stage } from './stage.js';

export interface StatusEvent {
  stage: Stage;
  changedAt: string;
  changedBy: string;
}

export interface Assignment {
  id: string;
  gameId: string;
  officialId: string;
  /** A user-enterable position key. R, U, LJ and so on. */
  position: string;
  feeCents: number;
  statusHistory: StatusEvent[];
}

/** The stage the assignment is sitting in right now. */
export function currentStage(assignment: Assignment): Stage {
  if (assignment.statusHistory.length === 0) return STAGES[0];

  const latest = [...assignment.statusHistory].sort(
    (a, b) => Date.parse(a.changedAt) - Date.parse(b.changedAt),
  );

  return latest[latest.length - 1]!.stage;
}
