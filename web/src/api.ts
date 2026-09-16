export interface DashboardDto {
  openByStage: Record<string, number>;
  gamesShortOfCrew: number;
  totalGames: number;
  totalAssignments: number;
}

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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export const getDashboard = () => getJson<DashboardDto>('/api/dashboard');
export const getFillRate = () => getJson<FillRateDto>('/api/fill-rate');
