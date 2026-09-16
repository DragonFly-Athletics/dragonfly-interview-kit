import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';

import { AssignmentService } from './application/assignmentService.js';
import { systemClock, type Clock } from './application/clock.js';
import { DashboardService } from './application/dashboardService.js';
import { FillRateService } from './application/fillRateService.js';
import type { Repositories } from './application/ports.js';
import {
  InMemoryAssignmentRepository,
  InMemoryDirectoryRepository,
  InMemoryGameRepository,
} from './infrastructure/inMemoryRepositories.js';

export interface AppOptions {
  repositories?: Repositories;
  clock?: Clock;
}

export interface App {
  server: FastifyInstance;
  repositories: Repositories;
}

export function buildRepositories(): Repositories {
  return {
    assignments: new InMemoryAssignmentRepository(),
    games: new InMemoryGameRepository(),
    directory: new InMemoryDirectoryRepository(),
  };
}

export async function buildApp(options: AppOptions = {}): Promise<App> {
  const repositories = options.repositories ?? buildRepositories();
  const clock = options.clock ?? systemClock;

  const dashboard = new DashboardService(repositories.assignments, repositories.games);
  const fillRate = new FillRateService(repositories.assignments, clock);
  const assignments = new AssignmentService(
    repositories.assignments,
    repositories.games,
    clock,
  );

  const server = Fastify({ logger: { level: 'info' } });
  await server.register(cors, { origin: true });

  server.get('/api/dashboard', async () => dashboard.getDashboard());

  server.get('/api/fill-rate', async () => fillRate.getFillRate());

  server.get<{ Params: { id: string } }>(
    '/api/games/:id',
    async (request, reply) => {
      const game = await repositories.games.getById(request.params.id);
      if (!game) {
        return reply.code(404).send({ message: 'Game not found' });
      }
      return {
        ...game,
        assignments: await repositories.assignments.getByGameId(game.id),
      };
    },
  );

  server.get<{ Params: { id: string } }>(
    '/api/assignments/:id',
    async (request, reply) => {
      const assignment = await assignments.getById(request.params.id);
      if (!assignment) {
        return reply.code(404).send({ message: 'Assignment not found' });
      }
      return assignment;
    },
  );

  server.post<{ Params: { id: string } }>(
    '/api/assignments/:id/advance',
    async (request, reply) => {
      const result = await assignments.advance(request.params.id);

      if (result === 'NotFound') {
        return reply.code(404).send({ message: 'Assignment not found' });
      }
      if (result === 'InvalidTransition') {
        return reply.code(400).send({
          message: 'An assignment cannot move backward or past Paid',
        });
      }
      if (result === 'Conflict') {
        return reply.code(409).send({
          message: 'That official is already committed to an overlapping game',
        });
      }
      return reply.code(204).send();
    },
  );

  return { server, repositories };
}
