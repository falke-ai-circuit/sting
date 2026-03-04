import { useEffect, useState } from 'react';

interface Stats {
  sessions: { total: number; hostile: number; committed: number; nuked: number; lab: number };
  events: { total: number };
  last_24h: { count: number };
}

const API_BASE = 'http://10.10.10.102:8001/api/v1';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [canaryCount, setCanaryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, samplesRes, canariesRes] = await Promise.all([
          fetch(`${API_BASE}/stats`),
          fetch(`${API_BASE}/samples?limit=1`),
          fetch(`${API_BASE}/canaries?limit=1`)
        ]);

        const statsData = await statsRes.json();
        const samplesData = await samplesRes.json();
        const canariesData = await canariesRes.json();

        setStats(statsData);
        setSampleCount(samplesData.length);
        setCanaryCount(canariesData.length);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="dashboard loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.sessions?.total ?? 0}</div>
          <div className="stat-label">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.events?.total ?? 0}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sampleCount}</div>
          <div className="stat-label">Samples</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{canaryCount}</div>
          <div className="stat-label">Canaries</div>
        </div>
      </div>

      <div className="stats-detail">
        <div className="detail-card">
          <h3>Session Breakdown</h3>
          <div className="breakdown">
            <span className="badge hostile">{stats?.sessions?.hostile ?? 0} Hostile</span>
            <span className="badge committed">{stats?.sessions?.committed ?? 0} Committed</span>
            <span className="badge nuked">{stats?.sessions?.nuked ?? 0} Nuked</span>
            <span className="badge lab">{stats?.sessions?.lab ?? 0} Lab</span>
          </div>
        </div>
        <div className="detail-card">
          <h3>Last 24 Hours</h3>
          <div className="stat-value">{stats?.last_24h?.count ?? 0}</div>
          <div className="stat-label">New Sessions</div>
        </div>
      </div>
    </div>
  );
}
