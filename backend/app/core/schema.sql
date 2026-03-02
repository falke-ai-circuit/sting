-- STING 2.0 Database Schema

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_ip TEXT NOT NULL,
    source_port INTEGER,
    protocol TEXT NOT NULL DEFAULT 'ssh',
    username TEXT,
    score INTEGER NOT NULL DEFAULT 100,
    state VARCHAR(50) NOT NULL DEFAULT 'hostile',
    verdict VARCHAR(50),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    committed_at TIMESTAMPTZ,
    nuked_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    score_delta INTEGER NOT NULL DEFAULT 0,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Canaries table
CREATE TABLE IF NOT EXISTS canaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    canary_type VARCHAR(50) NOT NULL,
    value TEXT NOT NULL,
    triggered_by UUID REFERENCES sessions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    triggered_at TIMESTAMPTZ
);

-- Samples table
CREATE TABLE IF NOT EXISTS samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    filename TEXT,
    sha256 TEXT,
    size_bytes BIGINT,
    content BYTEA,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_state ON sessions(state);
CREATE INDEX IF NOT EXISTS idx_canaries_type ON canaries(canary_type);
CREATE INDEX IF NOT EXISTS idx_samples_session ON samples(session_id);
