import { currentStage } from '../domain/assignment.js';
import { isCommitted, STAGES, type Stage } from '../domain/stage.js';
import { toDateOnly } from './clock.js';
import type { AssignmentRepository, GameRepository } from './ports.js';

/** How far ahead the desk looks for games that still need a crew. */
const HORIZON_DAYS = 7;

export interface DashboardDto {
  openByStage: Record<string, number>;
  gamesShortOfCrew: number;
  totalGames: number;
  totalAssignments: number;
}

/**
 * What the assigner looks at first: where every assignment is sitting,
 * and which games are about to start without a full crew.
 */
export class DashboardService {
  constructor(
    private readonly assignments: AssignmentRepository,
    private readonly games: GameRepository,
  ) {}

  async getDashboard(): Promise<DashboardDto> {
    const assignments = await this.assignments.getAll();
    const games = await this.games.getAll();

    const today = toDateOnly(new Date());
    const horizon = new Date();
    horizon.setUTCDate(horizon.getUTCDate() + HORIZON_DAYS);
    const horizonDay = toDateOnly(horizon);

    const openByStage: Record<string, number> = {};
    for (const stage of STAGES) {
      openByStage[stage] = assignments.filter(
        (a) => currentStage(a) === (stage as Stage),
      ).length;
    }

    const gamesShortOfCrew = games.filter((game) => {
      const day = game.startsAt.slice(0, 10);
      if (day < today || day > horizonDay) return false;

      const filled = assignments.filter(
        (a) => a.gameId === game.id && isCommitted(currentStage(a)),
      ).length;

      return filled < game.crewSize;
    }).length;

    return {
      openByStage,
      gamesShortOfCrew,
      totalGames: games.length,
      totalAssignments: assignments.length,
    };
  }
}
