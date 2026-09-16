import { buildApp } from './app.js';
import { loadSeed } from './infrastructure/seed.js';

const PORT = Number(process.env.PORT ?? 5072);

async function main(): Promise<void> {
  const { server, repositories } = await buildApp();

  const counts = await loadSeed(repositories);
  server.log.info(
    `Loaded ${counts.games} games, ${counts.assignments} assignments and ` +
      `${counts.officials} officials from the seed file`,
  );

  await server.listen({ port: PORT, host: '0.0.0.0' });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
