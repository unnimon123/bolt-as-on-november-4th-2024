-- Add tournament variations support
ALTER TABLE tournaments
ADD COLUMN format text DEFAULT 'single_elimination',
ADD COLUMN scope text DEFAULT 'public',
ADD COLUMN rules jsonb,
ADD COLUMN region text,
ADD CONSTRAINT valid_format CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
ADD CONSTRAINT valid_scope CHECK (scope IN ('public', 'private', 'invitational'));

-- Add enhanced matchmaking support
CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    game_type TEXT NOT NULL,
    entry_fee DECIMAL(10,2) NOT NULL,
    rating INTEGER NOT NULL,
    region TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Add indexes for improved query performance
CREATE INDEX idx_matchmaking_queue_criteria ON matchmaking_queue(game_type, entry_fee, rating);
CREATE INDEX idx_matchmaking_queue_region ON matchmaking_queue(region);

-- Add function to clean up stale queue entries
CREATE OR REPLACE FUNCTION cleanup_stale_queue_entries()
RETURNS void AS $$
BEGIN
    DELETE FROM matchmaking_queue
    WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job
SELECT cron.schedule(
    'cleanup_stale_queue_entries',
    '*/5 * * * *',
    $$SELECT cleanup_stale_queue_entries()$$
);