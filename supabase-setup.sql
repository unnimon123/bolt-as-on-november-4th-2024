-- Add tables for quick match and challenge system
CREATE TABLE IF NOT EXISTS public.quick_match_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    game_type TEXT NOT NULL,
    entry_fee DECIMAL(10,2) NOT NULL,
    rating INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.casual_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player1_id UUID REFERENCES public.profiles(id),
    player2_id UUID REFERENCES public.profiles(id),
    game_type TEXT NOT NULL,
    entry_fee DECIMAL(10,2) NOT NULL,
    prize_pool DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    player1_score INTEGER,
    player2_score INTEGER,
    winner_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_casual_match_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'disputed'))
);

CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenger_id UUID REFERENCES public.profiles(id),
    opponent_id UUID REFERENCES public.profiles(id),
    game_type TEXT NOT NULL,
    entry_fee DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_challenge_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS quick_match_queue_game_idx ON public.quick_match_queue(game_type, entry_fee, rating);
CREATE INDEX IF NOT EXISTS casual_matches_players_idx ON public.casual_matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS challenges_status_idx ON public.challenges(status);

-- Create function to handle match result submission
CREATE OR REPLACE FUNCTION submit_casual_match_result(
    p_match_id UUID,
    p_player1_score INTEGER,
    p_player2_score INTEGER,
    p_winner_id UUID
) RETURNS void AS $$
DECLARE
    v_match record;
    v_prize_pool decimal;
BEGIN
    -- Get match details
    SELECT * INTO v_match
    FROM public.casual_matches
    WHERE id = p_match_id
    FOR UPDATE;
    
    -- Validate match exists and is in progress
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match not found';
    END IF;
    
    IF v_match.status != 'in_progress' THEN
        RAISE EXCEPTION 'Match is not in progress';
    END IF;
    
    -- Validate winner is a participant
    IF p_winner_id != v_match.player1_id AND p_winner_id != v_match.player2_id THEN
        RAISE EXCEPTION 'Invalid winner';
    END IF;
    
    -- Update match result
    UPDATE public.casual_matches
    SET 
        player1_score = p_player1_score,
        player2_score = p_player2_score,
        winner_id = p_winner_id,
        status = 'completed'
    WHERE id = p_match_id;
    
    -- Distribute prize pool to winner
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + v_match.prize_pool
    WHERE id = p_winner_id;
    
    -- Create transaction record
    INSERT INTO public.transactions (
        user_id,
        amount,
        type,
        status,
        reference_id
    ) VALUES (
        p_winner_id,
        v_match.prize_pool,
        'prize',
        'completed',
        p_match_id
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired queue entries
CREATE OR REPLACE FUNCTION cleanup_match_queue() RETURNS void AS $$
BEGIN
    DELETE FROM public.quick_match_queue
    WHERE created_at < NOW() - INTERVAL '5 minutes';
    
    UPDATE public.challenges
    SET status = 'expired'
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up the queue
SELECT cron.schedule(
    'cleanup_match_queue',
    '*/5 * * * *', -- Run every 5 minutes
    $$SELECT cleanup_match_queue()$$
);