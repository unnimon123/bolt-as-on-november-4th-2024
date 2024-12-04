-- Add tournament chat support
CREATE TABLE IF NOT EXISTS tournament_chat (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id),
    user_id UUID REFERENCES profiles(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add tournament statistics support
CREATE TABLE IF NOT EXISTS tournament_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id),
    total_matches INTEGER DEFAULT 0,
    completed_matches INTEGER DEFAULT 0,
    average_score DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add function to update tournament statistics
CREATE OR REPLACE FUNCTION update_tournament_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tournament_statistics (tournament_id)
    VALUES (NEW.tournament_id)
    ON CONFLICT (tournament_id) DO UPDATE
    SET
        total_matches = (
            SELECT COUNT(*)
            FROM matches
            WHERE tournament_id = NEW.tournament_id
        ),
        completed_matches = (
            SELECT COUNT(*)
            FROM matches
            WHERE tournament_id = NEW.tournament_id
            AND status = 'completed'
        ),
        average_score = (
            SELECT AVG((player1_score + player2_score) / 2.0)
            FROM matches
            WHERE tournament_id = NEW.tournament_id
            AND player1_score IS NOT NULL
            AND player2_score IS NOT NULL
        ),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tournament statistics
CREATE TRIGGER update_tournament_stats_trigger
AFTER INSERT OR UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_tournament_statistics();

-- Add function to distribute tournament prizes
CREATE OR REPLACE FUNCTION distribute_tournament_prizes(
    p_tournament_id UUID,
    p_winners UUID[],
    p_prize_distribution DECIMAL[]
)
RETURNS void AS $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..array_length(p_winners, 1) LOOP
        -- Update winner's balance
        UPDATE profiles
        SET wallet_balance = wallet_balance + p_prize_distribution[i]
        WHERE id = p_winners[i];

        -- Create transaction record
        INSERT INTO transactions (
            user_id,
            amount,
            type,
            status,
            reference_id
        ) VALUES (
            p_winners[i],
            p_prize_distribution[i],
            'prize',
            'completed',
            p_tournament_id
        );
    END LOOP;

    -- Update tournament status
    UPDATE tournaments
    SET status = 'completed'
    WHERE id = p_tournament_id;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX idx_tournament_chat_tournament ON tournament_chat(tournament_id);
CREATE INDEX idx_tournament_chat_created ON tournament_chat(created_at);
CREATE INDEX idx_tournament_statistics_tournament ON tournament_statistics(tournament_id);