# DragonFly Assignment Desk

## Interview documents

Read these before you start:

- [INTERVIEW_RULES.md](INTERVIEW_RULES.md) — workflow, time-box, and setup notes
- [PROCESS.md](PROCESS.md) — short write-up template to complete after the session
- [RUBRIC_OVERVIEW.md](RUBRIC_OVERVIEW.md) — what the proctor observes

## What you're building

This starter is a small assignment desk for high school athletic
officials. It includes a Fastify API, a React + TypeScript dashboard, and
a seeded in-memory dataset of 70 games and about 200 officiating
assignments across three local associations.

Your job is to extend it so an assigner can advance an assignment to its
next stage and see the dashboard reflect open assignments per stage, games
that are short of a crew, and a basic fill-rate view.

## Domain primer (no athletics experience needed)

You do **not** need to know anything about high school sports to do this
challenge. Here is everything you need.

A **state association** governs high school athletics for a whole state.
Under it sit **local officiating associations**, and an **official**
belongs to one of those. An **assigner** works for a local association.
The assigner puts officials on games.

A **game** is one contest between a home school and an away school, in one
sport, at one level. Every game needs a **crew** — a fixed number of
officials, each in a named **position**. A varsity football crew is five
people: R, U, LJ, HL and BJ. A varsity basketball crew is three.

An **assignment** puts one official on one game in one position, for a
**fee**. The assignment moves through a lifecycle:

```
Offered → Accepted → Confirmed → Worked → Paid
```

Every stage change appends a **status event** to the assignment's history,
so the assignment carries its own audit trail. `Paid` is terminal.

One rule matters more than the rest. An official cannot work two games
that start within **three hours** of each other. The desk blocks the
second commitment. An open offer is not yet a commitment, so two
overlapping offers can sit in the system at the same time — but only one
of them can be accepted.

The assigner wants to know three things: where every assignment is
sitting, which games start soon without a full crew, and whether officials
accept offers as fast as the desk sends them. That's the whole domain.

## Time-box

**60 minutes**

Please keep your implementation tight and focused.

## What the starter provides

- **Fastify API** in `api/` with an in-memory repository (no database to install)
- **React + TypeScript** dashboard in `web/`
- **70 games and about 200 assignments** in `data/schedule.seed.json`, loaded when the API starts
- Existing dashboard and fill-rate endpoints
- Two starter tests in `api/src/__tests__/stage.test.ts`

> **Heads up:** parts of this starter were generated with AI and lightly reviewed. It runs, but it has rough edges — exactly the kind you'd inherit on a real team. Treat it as a codebase you've just been handed, not as a reference you should trust.

## Getting started

### Prerequisites

- Node.js 22 or later

No database installation is required.

### 1) Install dependencies

From the repo root:

```bash
npm install
```

### 2) Run the app

```bash
npm run dev
```

This starts the API on port 5072 and the Vite dev server on port 5173.
Vite proxies `/api` to `http://localhost:5072`.

To run one side on its own:

```bash
npm run dev:api
npm run dev:web
```

The API seeds itself from `data/schedule.seed.json` on startup. You do not
need to run a seed script.

### 3) Run tests

```bash
npm test
```

You are expected to add your own tests for the transition logic and the
fill-rate behavior as part of the exercise.

## The build

### Advance an assignment and reflect it on the dashboard

- An endpoint to record a stage change for an assignment.
- The dashboard should show **open assignments per stage** and **games
  short of a crew**.
- An assignment can only move forward through the lifecycle. Decide what
  happens on an invalid transition and enforce it.
- Respect the three-hour block. An official who is already committed to an
  overlapping game cannot accept another one.

### Fill rate (deliberately under-specified)

Add a **fill-rate** view: roughly, how many assignments officials accept
per day, and whether that keeps up with the offers the desk sends. Make
reasonable decisions, state your assumptions, and move on.

### Fix what's wrong

The starter has at least one real bug in its existing logic — the kind
that passes a casual glance and a happy-path demo but is wrong. Find it,
explain it, fix it, and prove the fix.

## Acceptance criteria

- An assignment can be advanced to its next stage through the API
- Invalid backward transitions are rejected
- An official is never committed to two games that start within three hours
- The dashboard shows open assignments per stage
- The dashboard shows games short of a crew
- A fill-rate view is added with reasonable assumptions documented by you
- The starter bug is found, explained, fixed, and covered by tests

## Deliverables

1. **The code**, with clear run instructions.
2. **`PROCESS.md`** — what AI tools you used, where AI output was wrong,
   how you validated your code, your fill-rate assumptions, and what
   you'd do next.
3. **Tests** covering the transition logic and the fill-rate metric.

## Ground rules

- **AI is encouraged.** Use your real workflow.
- **Time-box is real.** Ship a coherent slice; cut scope openly rather
  than running over.
- **Don't gold-plate.** This is not a production system. We're not grading
  polish.

## Finishing the session

1. Work in your normal AI-assisted workflow (Claude Code, Cursor, Codex,
   or any other tool)
2. When finished, run `./end.sh`

## Maintainer notes

To regenerate the seed dataset:

```bash
npm run seed
# or pin the reference date:
node scripts/generate-seed.mjs --today=2026-09-16
```

This overwrites `data/schedule.seed.json` with a deterministic dataset of
70 games, dated relative to the reference date. **Regenerate before each
hiring cycle** so the crew-shortage count and the fill rate still have
signal.

## Process

See [INTERVIEW_RULES.md](INTERVIEW_RULES.md) for the interview workflow.
