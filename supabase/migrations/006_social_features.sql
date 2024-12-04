-- Add direct messaging support
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id),
    receiver_id UUID REFERENCES profiles(id),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add achievements system
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    points INTEGER NOT NULL,
    criteria JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    achievement_id UUID REFERENCES achievements(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- Add player statistics for leaderboards
CREATE TABLE IF NOT EXISTS player_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) UNIQUE,
    rating INTEGER DEFAULT 1000,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    tournaments_played INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    current_win_streak INTEGER DEFAULT 0,
    best_win_streak INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(
    p_type TEXT,
    p_category TEXT,
    p_limit INTEGER
)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    score NUMERIC,
    rank INTEGER,
    change INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_players AS (
        SELECT 
            ps.user_id,
            p.username,
            p.avatar_url,
            CASE
                WHEN p_category = 'rating' THEN ps.rating::numeric
                WHEN p_category = 'wins' THEN ps.matches_won::numeric
                WHEN p_category = 'earnings' THEN ps.total_earnings
            END as score,
            ROW_NUMBER() OVER (
                ORDER BY
                    CASE
                        WHEN p_category = 'rating' THEN ps.rating
                        WHEN p_category = 'wins' THEN ps.matches_won
                        WHEN p_category = 'earnings' THEN ps.total_earnings
                    END DESC
            ) as rank,
            0 as change -- Placeholder for rank change
        FROM player_statistics ps
        JOIN profiles p ON p.id = ps.user_id
        WHERE 
            CASE
                WHEN p_type = 'monthly' THEN ps.updated_at >= date_trunc('month', NOW())
                WHEN p_type = 'weekly' THEN ps.updated_at >= date_trunc('week', NOW())
                ELSE true
            END
    )
    SELECT * FROM ranked_players
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX idx_direct_messages_users ON direct_messages(sender_id, receiver_id);
CREATE INDEX idx_direct_messages_created ON direct_messages(created_at);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_player_statistics_rating ON player_statistics(rating DESC);
CREATE INDEX idx_player_statistics_wins ON player_statistics(matches_won DESC);
CREATE INDEX idx_player_statistics_earnings ON player_statistics(total_earnings DESC);