import { useEffect, useState, type CSSProperties, type JSX } from 'react';

import {
  getDashboard,
  getFillRate,
  type DashboardDto,
  type FillRateDto,
} from './api.js';

const page: CSSProperties = {
  fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
  maxWidth: 760,
  margin: '0 auto',
  padding: '2rem 1rem',
  color: '#1c2024',
};

const card: CSSProperties = {
  border: '1px solid #d8dde2',
  borderRadius: 8,
  padding: '1rem 1.25rem',
  marginBottom: '1.25rem',
};

const row: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.35rem 0',
  borderBottom: '1px solid #eef1f4',
};

export function App(): JSX.Element {
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [fillRate, setFillRate] = useState<FillRateDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDashboard(), getFillRate()])
      .then(([d, f]) => {
        setDashboard(d);
        setFillRate(f);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Unable to load the desk');
      });
  }, []);

  if (error) {
    return (
      <main style={page}>
        <h1>DragonFly Assignment Desk</h1>
        <p style={{ color: '#b42318' }}>Unable to load the desk: {error}</p>
      </main>
    );
  }

  return (
    <main style={page}>
      <h1>DragonFly Assignment Desk</h1>
      <p style={{ color: '#5c6670' }}>
        Officials, games and crew status for the season.
      </p>

      <section style={card}>
        <h2>Assignments by stage</h2>
        {dashboard === null ? (
          <p>Loading…</p>
        ) : (
          <div>
            {Object.entries(dashboard.openByStage).map(([stage, count]) => (
              <div key={stage} style={row}>
                <span>{stage}</span>
                <strong>{count}</strong>
              </div>
            ))}
            <div style={{ ...row, paddingTop: '0.75rem' }}>
              <span>Games short of a crew (next 7 days)</span>
              <strong>{dashboard.gamesShortOfCrew}</strong>
            </div>
            <div style={{ ...row, borderBottom: 'none' }}>
              <span>Games on the schedule</span>
              <strong>{dashboard.totalGames}</strong>
            </div>
          </div>
        )}
      </section>

      <section style={card}>
        <h2>Fill rate</h2>
        {fillRate === null ? (
          <p>Loading…</p>
        ) : (
          <div>
            <div style={row}>
              <span>Accepted per day (14-day average)</span>
              <strong>{fillRate.acceptedPerDay}</strong>
            </div>
            <div style={row}>
              <span>Offered per day</span>
              <strong>{fillRate.offeredPerDay}</strong>
            </div>
            <div style={{ ...row, borderBottom: 'none' }}>
              <span>Keeping up</span>
              <strong>{fillRate.keepingUp ? 'Yes' : 'No'}</strong>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
