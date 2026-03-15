import { useEffect, useState } from 'react';

interface Honeypot {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  honeypot_type: 'SSH' | 'Web' | 'Database' | 'FTP';
  port: number;
  event_count: number;
  created_at: string;
}

const API_BASE = "/api/v1"

// Mock data for honeypots (will be replaced with API calls)
const mockHoneypots: Honeypot[] = [
  { id: '1', name: 'SSH-Decoy-01', status: 'running', honeypot_type: 'SSH', port: 2222, event_count: 47, created_at: '2024-01-15T10:00:00Z' },
  { id: '2', name: 'Web-Trap-Prod', status: 'running', honeypot_type: 'Web', port: 8080, event_count: 123, created_at: '2024-01-10T14:30:00Z' },
  { id: '3', name: 'DB-Honeypot-Main', status: 'stopped', honeypot_type: 'Database', port: 5432, event_count: 0, created_at: '2024-01-08T09:15:00Z' },
  { id: '4', name: 'FTP-Decoy-Alpha', status: 'running', honeypot_type: 'FTP', port: 2121, event_count: 8, created_at: '2024-01-12T16:45:00Z' },
  { id: '5', name: 'SSH-Lab-02', status: 'error', honeypot_type: 'SSH', port: 2223, event_count: 0, created_at: '2024-01-14T11:20:00Z' },
  { id: '6', name: 'Web-API-Decoy', status: 'running', honeypot_type: 'Web', port: 8443, event_count: 56, created_at: '2024-01-11T08:00:00Z' },
];

export default function Honeypots() {
  const [honeypots, setHoneypots] = useState<Honeypot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchHoneypots();
    const interval = setInterval(fetchHoneypots, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchHoneypots() {
    try {
      const res = await fetch(`${API_BASE}/honeypots`);
      if (res.ok) {
        const data = await res.json();
        setHoneypots(data.honeypots || []);
      } else {
        // Fallback to mock data if API not available
        setHoneypots(mockHoneypots);
      }
    } catch (err) {
      console.error('Failed to fetch honeypots:', err);
      setHoneypots(mockHoneypots);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartStop(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'running' ? 'stopped' : 'running';
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/honeypots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchHoneypots();
      }
    } catch (err) {
      console.error('Failed to update honeypot:', err);
    } finally {
      setActionLoading(null);
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClass = status === 'running' ? 'online' : status === 'stopped' ? 'offline' : 'warning';
    return <span className={`cyber-badge cyber-badge-${statusClass}`}>{status.toUpperCase()}</span>;
  };

  const getTypeBadge = (type: string) => {
    const typeClass = type.toLowerCase();
    return <span className={`type-badge type-badge-${typeClass}`}>{type}</span>;
  };

  const formatTime = (ts: string) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="honeypots loading">Loading...</div>;
  }

  return (
    <div className="honeypots">
      <div className="header-row">
        <h2>Honeypots</h2>
        <div className="header-actions">
          <button className="btn-base btn-sm btn-gray" onClick={fetchHoneypots}>
            Refresh
          </button>
        </div>
      </div>

      {honeypots.length === 0 ? (
        <p className="empty">No honeypots configured</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Type</th>
              <th>Port</th>
              <th>Events</th>
              <th>Created</th>
              <th>Controls</th>
            </tr>
          </thead>
          <tbody>
            {honeypots.map((honeypot) => (
              <tr key={honeypot.id} className={honeypot.status === 'error' ? 'row-error' : ''}>
                <td className="name">{honeypot.name}</td>
                <td>{getStatusBadge(honeypot.status)}</td>
                <td>{getTypeBadge(honeypot.honeypot_type)}</td>
                <td className="port">{honeypot.port}</td>
                <td className="events">{honeypot.event_count}</td>
                <td className="timestamp">{formatTime(honeypot.created_at)}</td>
                <td className="controls">
                  <button
                    className={`btn-base btn-sm ${honeypot.status === 'running' ? 'btn-red' : 'btn-green'}`}
                    onClick={() => handleStartStop(honeypot.id, honeypot.status)}
                    disabled={actionLoading === honeypot.id || honeypot.status === 'error'}
                  >
                    {actionLoading === honeypot.id
                      ? '...'
                      : honeypot.status === 'running'
                        ? 'Stop'
                        : 'Start'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
