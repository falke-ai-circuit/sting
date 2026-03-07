import { useEffect, useState } from 'react';

interface Sample {
  id: string;
  session_id: string | null;
  filename: string | null;
  sha256: string | null;
  size_bytes: number | null;
  uploaded_at: string;
}

const API_BASE = "/api/v1"

export default function Analysis() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSamples() {
      try {
        const res = await fetch(`${API_BASE}/samples?limit=50`);
        const data = await res.json();
        setSamples(data || []);
      } catch (err) {
        console.error('Failed to fetch samples:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSamples();
    const interval = setInterval(fetchSamples, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="samples loading">Loading...</div>;
  }

  const formatTime = (ts: string) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const formatSize = (bytes: number | null) => {
    if (bytes === null) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="samples">
      <h2>Payload Analysis</h2>
      {samples.length === 0 ? (
        <p className="empty">No samples uploaded</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>SHA256</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Session</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample) => (
              <tr key={sample.id}>
                <td className="filename">{sample.filename || '-'}</td>
                <td className="hash" title={sample.sha256 || ''}>
                  {sample.sha256 ? `${sample.sha256.slice(0, 16)}...` : '-'}
                </td>
                <td>{formatSize(sample.size_bytes)}</td>
                <td className="timestamp">{formatTime(sample.uploaded_at)}</td>
                <td className="session-id">
                  {sample.session_id ? (
                    <span title={sample.session_id}>{sample.session_id.slice(0, 8)}...</span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
