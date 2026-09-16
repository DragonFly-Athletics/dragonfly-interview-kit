import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import type { Repositories } from '../application/ports.js';
import type { Assignment } from '../domain/assignment.js';
import type { Game, Official } from '../domain/game.js';

const statusEventSchema = z.object({
  stage: z.enum(['Offered', 'Accepted', 'Confirmed', 'Completed', 'Paid']),
  changedAt: z.string(),
  changedBy: z.string(),
});

const assignmentSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  officialId: z.string(),
  position: z.string(),
  feeCents: z.number(),
  statusHistory: z.array(statusEventSchema).min(1),
});

const gameSchema = z.object({
  id: z.string(),
  homeSchoolId: z.string(),
  awaySchoolId: z.string(),
  sport: z.string(),
  level: z.string(),
  seasonYear: z.number(),
  startsAt: z.string(),
  crewSize: z.number(),
  positions: z.array(z.string()),
  orgId: z.string(),
});

const officialSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  orgId: z.string(),
  associationId: z.string(),
  rank: z.enum(['A', 'B']),
});

const seedDocumentSchema = z.object({
  generatedOn: z.string(),
  seasonYear: z.number(),
  association: z.object({
    id: z.string(),
    name: z.string(),
    stateCode: z.string(),
  }),
  orgs: z.array(z.object({
    id: z.string(),
    associationId: z.string(),
    name: z.string(),
  })),
  schools: z.array(z.object({ id: z.string(), name: z.string() })),
  officials: z.array(officialSchema),
  games: z.array(gameSchema),
  assignments: z.array(assignmentSchema),
});

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_SEED_PATH = join(apiRoot, '..', 'data', 'schedule.seed.json');

export interface SeedCounts {
  games: number;
  assignments: number;
  officials: number;
}

export async function loadSeed(
  repositories: Repositories,
  seedPath: string = process.env.SEED_PATH ?? DEFAULT_SEED_PATH,
): Promise<SeedCounts> {
  const raw = await readFile(seedPath, 'utf8');
  const parsed = seedDocumentSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    const issues = parsed.error.issues;
    const preview = issues
      .slice(0, 3)
      .map((i) => `  at ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    throw new Error(
      `Seed file failed validation: ${seedPath}\n` +
        `${issues.length} issue(s), first 3 shown:\n${preview}`,
    );
  }

  const doc = parsed.data;

  await repositories.directory.load({
    association: doc.association,
    orgs: doc.orgs,
    schools: doc.schools,
    officials: doc.officials as Official[],
  });
  await repositories.games.load(doc.games as Game[]);
  await repositories.assignments.load(doc.assignments as Assignment[]);

  return {
    games: doc.games.length,
    assignments: doc.assignments.length,
    officials: doc.officials.length,
  };
}
