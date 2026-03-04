import { useEffect, useState } from 'react';

interface Event {
  id: number;
  session_id: string;
  event_type: string;
  data: Record<string, unknown>;
  score_delta: number;
  ts: string;
}

const API_BASE = 'http://10.10.10.102:8001/api/v1';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(`${API_BASE}/events?limit=100`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="events loading">Loading...</div>;
  }

  // Extract IP and username from event data if available
  const getEventDetails = (event: Event): { ip: string; username: string } => {
    const data = event.data || {};
    const ip = (data.remote_ip as string) || (data.ip as string) || (data.source_ip as string) || '-';
    const username = (data.username as string) || (data.user as string) || '-';
    return { ip, username };
  };

  const formatTime = (ts: string) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString();
  };

  return (
    <div className="events">
      <h2>SSH Events</h2>
      {events.length === 0 ? (
        <p className="empty">No events yet</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Type</th>
              <th>IP Address</th>
              <th>Username</th>
              <th>Score Delta</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const details = getEventDetails(event);
              return (
                <tr key={event.id}>
                  <td className="timestamp">{formatTime(event.ts)}</td>
                  <td><span className="event-type">{event.event_type}</span></td>
                  <td className="ip">{details.ip}</td>
                  <td className="username">{details.username}</td>
                  <td className={`score ${event.score_delta > 0 ? 'positive' : event.score_delta < 0 ? 'negative' : ''}`}>
                    {event.score_delta > 0 ? '+' : ''}{event.score_delta}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
