import { useEffect, useState } from 'react';

interface Canary {
  id: string;
  name: string;
  canary_type: string;
  value: string;
  triggered_by: string | null;
  created_at: string;
  triggered_at: string | null;
}

const API_BASE = 'http://10.10.10.102:8001/api/v1';

export default function Canaries() {
  const [canaries, setCanaries] = useState<Canary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', canary_type: 'ssh', value: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCanaries();
    const interval = setInterval(fetchCanaries, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchCanaries() {
    try {
      const res = await fetch(`${API_BASE}/canaries?limit=50`);
      const data = await res.json();
      setCanaries(data || []);
    } catch (err) {
      console.error('Failed to fetch canaries:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.value) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/canaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ name: '', canary_type: 'ssh', value: '' });
        setShowForm(false);
        fetchCanaries();
      }
    } catch (err) {
      console.error('Failed to create canary:', err);
    } finally {
      setSubmitting(false);
    }
  }

  const formatTime = (ts: string) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const getTypeBadge = (type: string) => {
    return <span className={`type-badge ${type}`}>{type}</span>;
  };

  if (loading) {
    return <div className="canaries loading">Loading...</div>;
  }

  return (
    <div className="canaries">
      <div className="header-row">
        <h2>Canary Tokens</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Canary'}
        </button>
      </div>

      {showForm && (
        <form className="canary-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <select
              value={formData.canary_type}
              onChange={(e) => setFormData({ ...formData, canary_type: e.target.value })}
            >
              <option value="ssh">SSH</option>
              <option value="http">HTTP</option>
              <option value="file">File</option>
              <option value="dns">DNS</option>
            </select>
            <input
              type="text"
              placeholder="Value (token/credential/path)"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {canaries.length === 0 ? (
        <p className="empty">No canary tokens configured</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Value</th>
              <th>Created</th>
              <th>Triggered</th>
            </tr>
          </thead>
          <tbody>
            {canaries.map((canary) => (
              <tr key={canary.id} className={canary.triggered_at ? 'triggered' : ''}>
                <td className="name">{canary.name}</td>
                <td>{getTypeBadge(canary.canary_type)}</td>
                <td className="value" title={canary.value}>{canary.value}</td>
                <td className="timestamp">{formatTime(canary.created_at)}</td>
                <td className="triggered">
                  {canary.triggered_at ? (
                    <span className="triggered-badge">
                      Yes ({canary.triggered_by?.slice(0, 8) || '?'})
                    </span>
                  ) : (
                    <span className="not-triggered">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
