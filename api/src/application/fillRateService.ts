import { toDateOnly, type Clock } from './clock.js';
import type { AssignmentRepository } from './ports.js';

const WINDOW_DAYS = 14;

export interface FillDayDto {
  day: string;
  accepted: number;
}

export interface FillRateDto {
  daily: FillDayDto[];
  acceptedPerDay: number;
  offeredPerDay: number;
  keepingUp: boolean;
}

/**
 * How fast officials are taking the games they are offered, over a
 * rolling 14-day window, against how fast the assigner puts new offers
 * out. If offers outrun acceptances the desk falls behind.
 */
export class FillRateService {
  constructor(
    private readonly assignments: AssignmentRepository,
    private readonly clock: Clock,
  ) {}

  async getFillRate(): Promise<FillRateDto> {
    const assignments = await this.assignments.getAll();
    const now = this.clock.now();

    const days: string[] = [];
    for (let offset = WINDOW_DAYS - 1; offset >= 0; offset--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - offset);
      days.push(toDateOnly(d));
    }

    const firstDay = days[0]!;
    const lastDay = days[days.length - 1]!;

    const acceptedByDay = new Map<string, number>(days.map((d) => [d, 0]));
    let offered = 0;

    for (const assignment of assignments) {
      for (const event of assignment.statusHistory) {
        const day = event.changedAt.slice(0, 10);
        if (day < firstDay || day > lastDay) continue;

        if (event.stage === 'Accepted') {
          acceptedByDay.set(day, (acceptedByDay.get(day) ?? 0) + 1);
        }
        if (event.stage === 'Offered') {
          offered++;
        }
      }
    }

    const daily = days.map((day) => ({ day, accepted: acceptedByDay.get(day)! }));
    const totalAccepted = daily.reduce((sum, d) => sum + d.accepted, 0);

    const acceptedPerDay = totalAccepted / WINDOW_DAYS;
    const offeredPerDay = offered / WINDOW_DAYS;

    return {
      daily,
      acceptedPerDay: Number(acceptedPerDay.toFixed(2)),
      offeredPerDay: Number(offeredPerDay.toFixed(2)),
      keepingUp: acceptedPerDay >= offeredPerDay,
    };
  }
}
