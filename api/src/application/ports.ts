import type { Assignment } from '../domain/assignment.js';
import type {
  Association,
  Game,
  Official,
  OfficiatingOrg,
  School,
} from '../domain/game.js';

export interface AssignmentRepository {
  getAll(): Promise<Assignment[]>;
  getById(id: string): Promise<Assignment | undefined>;
  getByGameId(gameId: string): Promise<Assignment[]>;
  save(assignment: Assignment): Promise<void>;
  load(assignments: Assignment[]): Promise<void>;
}

export interface GameRepository {
  getAll(): Promise<Game[]>;
  getById(id: string): Promise<Game | undefined>;
  load(games: Game[]): Promise<void>;
}

export interface DirectoryRepository {
  getAssociation(): Promise<Association | undefined>;
  getOrgs(): Promise<OfficiatingOrg[]>;
  getSchools(): Promise<School[]>;
  getOfficials(): Promise<Official[]>;
  getOfficialById(id: string): Promise<Official | undefined>;
  load(directory: {
    association: Association;
    orgs: OfficiatingOrg[];
    schools: School[];
    officials: Official[];
  }): Promise<void>;
}

export interface Repositories {
  assignments: AssignmentRepository;
  games: GameRepository;
  directory: DirectoryRepository;
}
