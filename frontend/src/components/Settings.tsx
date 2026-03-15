import { useEffect, useState } from 'react';

interface Canary {
  id: string;
  name: string;
  canary_type: string;
  path?: string;
  content?: string;
  hit_count: number;
  is_active: boolean;
  created_at: string;
}

const API_BASE = "/api/v1"

// Type display names and colors
const typeConfig: Record<string, { label: string; color: string }> = {
  ssh_key: { label: 'SSH KEY', color: 'bg-purple-600' },
  ssh_password: { label: 'SSH PASSWORD', color: 'bg-red-600' },
  web_credential: { label: 'WEB CREDENTIAL', color: 'bg-blue-600' },
  api_token: { label: 'API TOKEN', color: 'bg-green-600' },
  file: { label: 'FILE TOKEN', color: 'bg-orange-600' },
  credential: { label: 'CREDENTIAL', color: 'bg-yellow-600' },
  url: { label: 'URL', color: 'bg-indigo-600' },
  dns: { label: 'DNS', color: 'bg-pink-600' },
};

export default function Settings() {
  const [canaries, setCanaries] = useState<Canary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', canary_type: 'ssh_key', path: '' });
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
    if (!formData.name) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/canaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          canary_type: formData.canary_type,
          path: formData.path || null,
          content: null
        })
      });
      if (res.ok) {
        setFormData({ name: '', canary_type: 'ssh_key', path: '' });
        setShowForm(false);
        fetchCanaries();
      }
    } catch (err) {
      console.error('Failed to create canary:', err);
    } finally {
      setSubmitting(false);
    }
  }

  const formatDate = (ts: string) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleDateString();
  };

  const getTypeInfo = (type: string) => {
    return typeConfig[type] || { label: type.toUpperCase(), color: 'bg-gray-600' };
  };

  // Calculate stats
  const total = canaries.length;
  const triggered = canaries.filter(c => c.hit_count > 0).length;
  const active = canaries.filter(c => c.is_active).length;
  const attackers = new Set(canaries.filter(c => c.hit_count > 0).map(c => c.path || c.name)).size;

  if (loading) {
    return <div className="canaries loading p-4">Loading...</div>;
  }

  return (
    <div className="canaries">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-cyber-red">Canaries</h2>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-cyber-dark border border-cyber-gray p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Total</div>
          <div className="text-2xl font-bold text-white">{total}</div>
        </div>
        <div className="bg-cyber-dark border border-cyber-gray p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Triggered</div>
          <div className="text-2xl font-bold text-cyber-red">{triggered}</div>
        </div>
        <div className="bg-cyber-dark border border-cyber-gray p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Active</div>
          <div className="text-2xl font-bold text-green-400">{active}</div>
        </div>
        <div className="bg-cyber-dark border border-cyber-gray p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Attackers</div>
          <div className="text-2xl font-bold text-orange-400">{attackers}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-6">
        <button
          className="btn-base btn-md btn-green"
          onClick={() => setShowForm(!showForm)}
        >
          + Generate Canary
        </button>
        <button className="btn-base btn-md btn-gray">
          Export All
        </button>
        <button className="btn-base btn-md btn-blue">
          Deploy to Server
        </button>
        <button className="btn-base btn-md btn-purple" onClick={fetchCanaries}>
          Refresh
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form className="canary-form bg-cyber-dark border border-cyber-gray p-4 mb-6" onSubmit={handleSubmit}>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Name"
              className="cyber-input flex-1 min-w-[150px]"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <select
              className="cyber-select flex-1 min-w-[150px]"
              value={formData.canary_type}
              onChange={(e) => setFormData({ ...formData, canary_type: e.target.value })}
            >
              <option value="ssh_key">SSH Key</option>
              <option value="ssh_password">SSH Password</option>
              <option value="web_credential">Web Credential</option>
              <option value="api_token">API Token</option>
              <option value="file">File Token</option>
              <option value="dns">DNS Token</option>
            </select>
            <input
              type="text"
              placeholder="Deployment Path (optional)"
              className="cyber-input flex-1 min-w-[200px]"
              value={formData.path}
              onChange={(e) => setFormData({ ...formData, path: e.target.value })}
            />
            <button type="submit" className="btn-base btn-md btn-green" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Card Grid */}
      {canaries.length === 0 ? (
        <p className="text-gray-400">No canary tokens configured</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canaries.map((canary) => {
            const typeInfo = getTypeInfo(canary.canary_type);
            const isTriggered = canary.hit_count > 0;
            const deploymentLocation = canary.path || canary.name;
            return (
              <div
                key={canary.id}
                className={`bg-cyber-dark border p-4 ${isTriggered ? 'border-cyber-red' : 'border-cyber-gray'}`}
              >
                {/* Type Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 text-xs font-bold text-white ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <span className={`px-2 py-1 text-xs font-bold ${isTriggered ? 'bg-cyber-red text-white' : 'bg-green-600 text-white'}`}>
                    {isTriggered ? `TRIGGERED ${canary.hit_count}x` : 'NOT TRIGGERED'}
                  </span>
                </div>

                {/* Value / Content */}
                <div className="mb-3">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Value</div>
                  <div className="font-mono text-sm text-cyan-400 truncate" title={canary.content || deploymentLocation}>
                    {canary.content || deploymentLocation || '-'}
                  </div>
                </div>

                {/* Deployment Location */}
                <div className="mb-3">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Deployment Location</div>
                  <div className="text-sm text-gray-300 truncate" title={deploymentLocation}>
                    {deploymentLocation || '-'}
                  </div>
                </div>

                {/* Created Date */}
                <div className="mb-3">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Created</div>
                  <div className="text-sm text-gray-300">
                    {formatDate(canary.created_at)}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs font-bold ${canary.is_active ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}>
                    {canary.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
