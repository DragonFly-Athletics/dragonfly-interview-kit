import type { Assignment } from '../domain/assignment.js';
import type {
  Association,
  Game,
  Official,
  OfficiatingOrg,
  School,
} from '../domain/game.js';
import type {
  AssignmentRepository,
  DirectoryRepository,
  GameRepository,
} from '../application/ports.js';

/**
 * Holds the whole season in memory. Good enough for one association's
 * assignment desk; there is no database to install.
 */
export class InMemoryAssignmentRepository implements AssignmentRepository {
  private readonly assignments = new Map<string, Assignment>();

  async load(assignments: Assignment[]): Promise<void> {
    this.assignments.clear();
    for (const assignment of assignments) {
      this.assignments.set(assignment.id, assignment);
    }
  }

  async getAll(): Promise<Assignment[]> {
    return [...this.assignments.values()];
  }

  async getById(id: string): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getByGameId(gameId: string): Promise<Assignment[]> {
    return [...this.assignments.values()].filter((a) => a.gameId === gameId);
  }

  async save(assignment: Assignment): Promise<void> {
    this.assignments.set(assignment.id, assignment);
  }
}

export class InMemoryGameRepository implements GameRepository {
  private readonly games = new Map<string, Game>();

  async load(games: Game[]): Promise<void> {
    this.games.clear();
    for (const game of games) {
      this.games.set(game.id, game);
    }
  }

  async getAll(): Promise<Game[]> {
    return [...this.games.values()];
  }

  async getById(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }
}

export class InMemoryDirectoryRepository implements DirectoryRepository {
  private association: Association | undefined;
  private orgs: OfficiatingOrg[] = [];
  private schools: School[] = [];
  private officials = new Map<string, Official>();

  async load(directory: {
    association: Association;
    orgs: OfficiatingOrg[];
    schools: School[];
    officials: Official[];
  }): Promise<void> {
    this.association = directory.association;
    this.orgs = directory.orgs;
    this.schools = directory.schools;
    this.officials = new Map(directory.officials.map((o) => [o.id, o]));
  }

  async getAssociation(): Promise<Association | undefined> {
    return this.association;
  }

  async getOrgs(): Promise<OfficiatingOrg[]> {
    return this.orgs;
  }

  async getSchools(): Promise<School[]> {
    return this.schools;
  }

  async getOfficials(): Promise<Official[]> {
    return [...this.officials.values()];
  }

  async getOfficialById(id: string): Promise<Official | undefined> {
    return this.officials.get(id);
  }
}
