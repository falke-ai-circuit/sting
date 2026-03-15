import { useEffect, useState } from 'react';

interface Session {
  id: string;
  source_ip: string;
  source_port: number | null;
  protocol: string;
  score: number;
  state: string;
  verdict: string | null;
  username: string | null;
  started_at: string;
  ended_at: string | null;
  live_state: string | null;
}

const API_BASE = "/api/v1"

// Calculate duration from timestamps
function calculateDuration(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diffMs = end - start;
  
  if (diffMs < 1000) return '<1s';
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    async function fetchSessions() {
      try {
        const url = filter
          ? `${API_BASE}/sessions?state=${filter}&limit=50`
          : `${API_BASE}/sessions?limit=50`;
        const res = await fetch(url);
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  if (loading) {
    return <div className="sessions loading">Loading...</div>;
  }

  const formatTime = (ts: string) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const getStateBadge = (state: string) => {
    return <span className={`state-badge ${state}`}>{state}</span>;
  };

  return (
    <div className="sessions">
      <h2 className="section-header" style={{ color: '#ff0040', marginBottom: '1.5rem' }}>Sessions</h2>
      <div className="filter-bar">
        <label>Filter by state:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="hostile">Hostile</option>
          <option value="suspicious">Suspicious</option>
          <option value="clean">Clean</option>
          <option value="committed">Committed</option>
          <option value="nuked">Nuked</option>
          <option value="lab">Lab</option>
        </select>
      </div>
      {sessions.length === 0 ? (
        <p className="empty">No sessions yet</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Source IP</th>
              <th>Username</th>
              <th>Score</th>
              <th>State</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="session-id" title={session.id}>{session.id.slice(0, 8)}...</td>
                <td className="timestamp">{formatTime(session.started_at)}</td>
                <td className="duration">{calculateDuration(session.started_at, session.ended_at)}</td>
                <td className="ip">{session.source_ip}:{session.source_port || '-'}</td>
                <td className="username">{session.username || '-'}</td>
                <td className={`score ${session.score >= 30 ? 'hostile' : session.score >= 10 ? 'suspicious' : ''}`}>
                  {session.score}
                </td>
                <td>{getStateBadge(session.state)}</td>
                <td className="verdict">{session.verdict || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
