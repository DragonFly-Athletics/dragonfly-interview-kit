import { currentStage, type Assignment } from '../domain/assignment.js';
import { overlaps } from '../domain/game.js';
import { isCommitted, nextStage } from '../domain/stage.js';
import type { Clock } from './clock.js';
import type { AssignmentRepository, GameRepository } from './ports.js';

export type AdvanceResult =
  | 'Advanced'
  | 'NotFound'
  | 'InvalidTransition'
  | 'Conflict';

/**
 * Moves an assignment forward through its lifecycle. An assignment
 * never moves backward and never moves past Paid.
 *
 * An official cannot be committed to two games in the same three-hour
 * block, so the step from Offered to Accepted is checked against the
 * rest of that official's schedule.
 */
export class AssignmentService {
  constructor(
    private readonly assignments: AssignmentRepository,
    private readonly games: GameRepository,
    private readonly clock: Clock,
  ) {}

  async advance(assignmentId: string): Promise<AdvanceResult> {
    const assignment = await this.assignments.getById(assignmentId);
    if (!assignment) return 'NotFound';

    const next = nextStage(currentStage(assignment));
    if (next === null) return 'InvalidTransition';

    if (isCommitted(next) && (await this.hasConflict(assignment))) {
      return 'Conflict';
    }

    assignment.statusHistory.push({
      stage: next,
      changedAt: this.clock.now().toISOString(),
      changedBy: 'assigner',
    });

    await this.assignments.save(assignment);
    return 'Advanced';
  }

  /** True when this official is already committed to an overlapping game. */
  private async hasConflict(assignment: Assignment): Promise<boolean> {
    const game = await this.games.getById(assignment.gameId);
    if (!game) return false;

    const all = await this.assignments.getAll();

    for (const other of all) {
      if (other.id === assignment.id) continue;
      if (other.officialId !== assignment.officialId) continue;
      if (!isCommitted(currentStage(other))) continue;

      const otherGame = await this.games.getById(other.gameId);
      if (otherGame && overlaps(game, otherGame)) return true;
    }

    return false;
  }

  async getById(assignmentId: string): Promise<Assignment | undefined> {
    return this.assignments.getById(assignmentId);
  }
}
