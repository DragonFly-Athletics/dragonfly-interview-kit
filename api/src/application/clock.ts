/** A port over the wall clock, so date logic stays testable. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** YYYY-MM-DD in UTC. Our date-only fields use this shape. */
export function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}
