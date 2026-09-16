#!/usr/bin/env node
/**
 * Deterministic seed data generator for the DragonFly Assignment Desk.
 * Writes data/schedule.seed.json with ~70 games and ~200 assignments.
 *
 * Usage:
 *   node scripts/generate-seed.mjs                 # relative to today
 *   node scripts/generate-seed.mjs --today=2026-09-16
 *
 * Dates are generated relative to the reference date, so the dashboard
 * always has games short of a crew and the fill rate always has signal.
 * Regenerate before each hiring cycle.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GAME_COUNT = 70;
const SEASON_YEAR = 2026;

// state association → local officiating organisation → official.
// All names here are invented. They are not real customers.
const ASSOCIATION = {
  id: 'assoc-lakeshore',
  name: 'Lakeshore Interscholastic Association',
  stateCode: 'LK',
};

const ORGS = [
  { id: 'org-tri-county', associationId: ASSOCIATION.id, name: 'Tri-County Officials Association' },
  { id: 'org-river-valley', associationId: ASSOCIATION.id, name: 'River Valley Officials Association' },
  { id: 'org-cedar-ridge', associationId: ASSOCIATION.id, name: 'Cedar Ridge Officials Association' },
];

const SCHOOLS = [
  { id: 'school-northgate', name: 'Northgate High School' },
  { id: 'school-riverbend', name: 'Riverbend High School' },
  { id: 'school-cedar-hill', name: 'Cedar Hill High School' },
  { id: 'school-maple-grove', name: 'Maple Grove High School' },
  { id: 'school-fort-lennox', name: 'Fort Lennox High School' },
];

// crewSize is how many officials the game needs. The state association
// sets it; a school can buy a bigger crew, which is why it lives here.
const CONTESTS = [
  { sport: 'Football', level: 'Varsity', crewSize: 5, positions: ['R', 'U', 'LJ', 'HL', 'BJ'] },
  { sport: 'Football', level: 'JV', crewSize: 4, positions: ['R', 'U', 'LJ', 'HL'] },
  { sport: 'Basketball', level: 'Varsity', crewSize: 3, positions: ['R', 'U1', 'U2'] },
  { sport: 'Soccer', level: 'Varsity', crewSize: 3, positions: ['CR', 'AR1', 'AR2'] },
  { sport: 'Volleyball', level: 'Varsity', crewSize: 2, positions: ['R1', 'R2'] },
  { sport: 'Baseball', level: 'Varsity', crewSize: 2, positions: ['PU', 'BU'] },
];

// The assignment lifecycle. Paid is terminal.
const STAGES = ['Offered', 'Accepted', 'Confirmed', 'Worked', 'Paid'];
const PAID = STAGES.length - 1;

const FIRST_NAMES = [
  'Avery', 'Jordan', 'Riley', 'Casey', 'Micah', 'Sydney', 'Bryce', 'Harper',
  'Devon', 'Elise', 'Tanner', 'Nia', 'Cole', 'Maya', 'Luca', 'Reese',
  'Quinn', 'Dante', 'Iris', 'Rowan',
];
const LAST_NAMES = [
  'Whitfield', 'Okafor', 'Delgado', 'Brennan', 'Sandoval', 'Kirby', 'Nguyen',
  'Castille', 'Mbeki', 'Fontaine', 'Ramsey', 'Ortega', 'Halloran', 'Ivey',
  'Petrov', 'Salazar', 'Draper', 'Yoon', 'Amari', 'Vance',
];

function parseToday() {
  const arg = process.argv.find((a) => a.startsWith('--today='));
  const raw = arg ? arg.slice('--today='.length) : null;
  const d = raw ? new Date(`${raw}T12:00:00Z`) : new Date();
  if (Number.isNaN(d.getTime())) {
    console.error(`Invalid --today value: ${raw}. Use YYYY-MM-DD.`);
    process.exit(1);
  }
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

const TODAY = parseToday();

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function dateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, days) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function addHours(d, hours) {
  const copy = new Date(d);
  copy.setUTCHours(copy.getUTCHours() + hours);
  return copy;
}

// ---------------------------------------------------------------- officials

const officials = [];
let officialSeq = 0;

for (const org of ORGS) {
  for (let i = 0; i < 12; i++) {
    officialSeq++;
    officials.push({
      id: `official-${String(officialSeq).padStart(3, '0')}`,
      firstName: pick(FIRST_NAMES),
      lastName: pick(LAST_NAMES),
      orgId: org.id,
      associationId: org.associationId,
      // An assigner is looking for the best player available.
      rank: rand() < 0.4 ? 'A' : 'B',
    });
  }
}

// ---------------------------------------------------------------- games

const games = [];

for (let i = 1; i <= GAME_COUNT; i++) {
  const contest = pick(CONTESTS);

  let home = pick(SCHOOLS);
  let away = pick(SCHOOLS);
  while (away.id === home.id) away = pick(SCHOOLS);

  // Games spread from 21 days behind to 21 days ahead of the reference
  // date, so the desk has both worked games and games still to staff.
  const startsAt = addDays(TODAY, -21 + Math.floor(rand() * 43));
  startsAt.setUTCHours(18 + Math.floor(rand() * 4), rand() < 0.5 ? 0 : 30, 0, 0);

  games.push({
    id: `game-${String(i).padStart(3, '0')}`,
    homeSchoolId: home.id,
    awaySchoolId: away.id,
    sport: contest.sport,
    level: contest.level,
    seasonYear: SEASON_YEAR,
    startsAt: startsAt.toISOString(),
    crewSize: contest.crewSize,
    positions: contest.positions,
    orgId: pick(ORGS).id,
  });
}

// ---------------------------------------------------------------- assignments

function buildStatusHistory(targetStageIndex, offeredAt) {
  const history = [];
  let cursor = new Date(offeredAt);

  for (let stage = 0; stage <= targetStageIndex; stage++) {
    if (stage > 0) cursor = addHours(cursor, 6 + Math.floor(rand() * 60));
    history.push({
      stage: STAGES[stage],
      changedAt: cursor.toISOString(),
      changedBy: 'seed',
    });
  }

  return history;
}

const assignments = [];
let assignmentSeq = 0;

// An official cannot work two games at once. The platform uses a flat
// three-hour block to decide that, on the assumption that the longest
// football game runs three hours.
const BLOCK_HOURS = 3;

/** Committed game start times per official, for stages Accepted and later. */
const committed = new Map();

function hasConflict(officialId, kickoff) {
  const held = committed.get(officialId) ?? [];
  return held.some(
    (t) => Math.abs(t - kickoff.getTime()) < BLOCK_HOURS * 60 * 60 * 1000,
  );
}

function commit(officialId, kickoff) {
  const held = committed.get(officialId) ?? [];
  held.push(kickoff.getTime());
  committed.set(officialId, held);
}

function addAssignment(game, official, position, targetStage) {
  assignmentSeq++;

  const kickoff = new Date(game.startsAt);
  const offeredAt = addDays(kickoff, -14 - Math.floor(rand() * 14));
  offeredAt.setUTCHours(9 + Math.floor(rand() * 8), 0, 0, 0);

  assignments.push({
    id: `assignment-${String(assignmentSeq).padStart(3, '0')}`,
    gameId: game.id,
    officialId: official.id,
    position,
    feeCents: 3500 + Math.floor(rand() * 8) * 250,
    statusHistory: buildStatusHistory(targetStage, offeredAt),
  });

  if (targetStage >= 1) commit(official.id, kickoff);
}

for (const game of games) {
  const kickoff = new Date(game.startsAt);
  const inThePast = kickoff < TODAY;

  // Leave some games short of a full crew. That is the assigner's
  // whole job, so the dashboard has to show it.
  const shortBy = rand() < 0.3 ? 1 + Math.floor(rand() * 2) : 0;
  const slots = Math.max(1, game.crewSize - shortBy);

  const orgOfficials = officials.filter((o) => o.orgId === game.orgId);
  const taken = new Set();

  for (let slot = 0; slot < slots; slot++) {
    // A game in the past has mostly been worked and paid. A game still
    // to come is somewhere between offered and confirmed.
    const roll = rand();
    let targetStage;
    if (inThePast) {
      if (roll < 0.08) targetStage = 1;
      else if (roll < 0.2) targetStage = 2;
      else if (roll < 0.55) targetStage = 3;
      else targetStage = PAID;
    } else {
      if (roll < 0.35) targetStage = 0;
      else if (roll < 0.75) targetStage = 1;
      else targetStage = 2;
    }

    // Find an official who is free. An offer is not a commitment, so
    // only stages from Accepted onward have to clear the block.
    let official = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      const candidate = pick(orgOfficials);
      if (taken.has(candidate.id)) continue;
      if (targetStage >= 1 && hasConflict(candidate.id, kickoff)) continue;
      official = candidate;
      break;
    }
    if (!official) continue;

    taken.add(official.id);
    addAssignment(game, official, game.positions[slot] ?? `X${slot + 1}`, targetStage);
  }
}

// Competing offers. An assigner shops one slot around, so the same
// official can hold two open offers that overlap.
const upcoming = games.filter((g) => new Date(g.startsAt) > TODAY);

for (const game of upcoming.slice(0, 12)) {
  const kickoff = new Date(game.startsAt);
  const orgOfficials = officials.filter((o) => o.orgId === game.orgId);

  const rival = orgOfficials.find((o) => {
    if (hasConflict(o.id, kickoff)) return false;
    return assignments.some((a) => {
      if (a.officialId !== o.id) return false;
      if (a.gameId === game.id) return false;
      if (a.statusHistory.at(-1).stage !== 'Offered') return false;
      const other = games.find((g) => g.id === a.gameId);
      return (
        Math.abs(Date.parse(other.startsAt) - kickoff.getTime()) <
        BLOCK_HOURS * 60 * 60 * 1000
      );
    });
  });

  if (rival) addAssignment(game, rival, 'ALT', 0);
}

// ---------------------------------------------------------------- output

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(repoRoot, 'data', 'schedule.seed.json');

const document = {
  generatedOn: dateOnly(TODAY),
  seasonYear: SEASON_YEAR,
  association: ASSOCIATION,
  orgs: ORGS,
  schools: SCHOOLS,
  officials,
  games,
  assignments,
};

writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

const currentStage = (a) => a.statusHistory.at(-1).stage;
const staffed = new Set(['Accepted', 'Confirmed', 'Worked', 'Paid']);
const paid = assignments.filter((a) => currentStage(a) === 'Paid').length;

const horizon = addDays(TODAY, 7);
const short = games.filter((g) => {
  const kickoff = new Date(g.startsAt);
  if (kickoff < TODAY || kickoff > horizon) return false;
  const filled = assignments.filter(
    (a) => a.gameId === g.id && staffed.has(currentStage(a)),
  ).length;
  return filled < g.crewSize;
}).length;

const since = addDays(TODAY, -14).toISOString();
const accepted = assignments.filter((a) =>
  a.statusHistory.some((e) => e.stage === 'Accepted' && e.changedAt >= since),
).length;
const offered = assignments.filter((a) =>
  a.statusHistory.some((e) => e.stage === 'Offered' && e.changedAt >= since),
).length;

console.log(`Wrote ${games.length} games and ${assignments.length} assignments to ${outPath}`);
console.log(`  Reference date: ${dateOnly(TODAY)}`);
console.log(`  Officials: ${officials.length} across ${ORGS.length} organisations`);
console.log(`  Paid out: ${paid}`);
console.log(`  Games short of a crew in the next 7 days: ${short}`);
console.log(`  Accepted in the last 14 days: ${accepted}`);
console.log(`  Offered in the last 14 days: ${offered}`);
console.log(`  Lifecycle: ${STAGES.join(' → ')}`);
