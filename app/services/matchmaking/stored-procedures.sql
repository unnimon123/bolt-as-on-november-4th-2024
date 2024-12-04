-- Create quick match
CREATE OR REPLACE FUNCTION create_quick_match(
    p_player1_id UUID,
    p_player2_id UUID,
    p_game_type TEXT,
    p_entry_fee DECIMAL,
    p_prize_pool DECIMAL,
    p_platform_fee DECIMAL
) RETURNS json AS $$
DECLARE
    v_match_id UUID;
BEGIN
    -- Start transaction
    BEGIN
        -- Remove players from queue
        DELETE FROM quick_match_queue
        WHERE user_id IN (p_player1_id, p_player2_id);

        -- Create match
        INSERT INTO casual_matches (
            player1_id,
            player2_id,
            game_type,
            entry_fee,
            prize_pool,
            platform_fee,
            status
        ) VALUES (
            p_player1_id,
            p_player2_id,
            p_game_type,
            p_entry_fee,
            p_prize_pool,
            p_platform_fee,
            'scheduled'
        ) RETURNING id INTO v_match_id;

        -- Process entry fees
        UPDATE profiles
        SET wallet_balance = wallet_balance - p_entry_fee
        WHERE id IN (p_player1_id, p_player2_id);

        -- Create transaction records
        INSERT INTO transactions (user_id, amount, type, status, reference_id)
        SELECT 
            id,
            p_entry_fee,
            'entry_fee',
            'completed',
            v_match_id
        FROM unnest(ARRAY[p_player1_id, p_player2_id]) AS id;

        -- Return match details
        RETURN json_build_object(
            'match_id', v_match_id,
            'status', 'created'
        );
    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction on error
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Accept challenge
CREATE OR REPLACE FUNCTION accept_challenge(
    p_challenge_id UUID,
    p_prize_pool DECIMAL,
    p_platform_fee DECIMAL
) RETURNS void AS $$
DECLARE
    v_challenge record;
    v_match_id UUID;
BEGIN
    -- Start transaction
    BEGIN
        -- Get challenge details
        SELECT * INTO v_challenge
        FROM challenges
        WHERE id = p_challenge_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Challenge not found';
        END IF;

        IF v_challenge.status != 'pending' THEN
            RAISE EXCEPTION 'Challenge is not pending';
        END IF;

        -- Create match
        INSERT INTO casual_matches (
            player1_id,
            player2_id,
            game_type,
            entry_fee,
            prize_pool,
            platform_fee,
            status
        ) VALUES (
            v_challenge.challenger_id,
            v_challenge.opponent_id,
            v_challenge.game_type,
            v_challenge.entry_fee,
            p_prize_pool,
            p_platform_fee,
            'scheduled'
        ) RETURNING id INTO v_match_id;

        -- Process entry fees
        UPDATE profiles
        SET wallet_balance = wallet_balance - v_challenge.entry_fee
        WHERE id IN (v_challenge.challenger_id, v_challenge.opponent_id);

        -- Create transaction records
        INSERT INTO transactions (user_id, amount, type, status, reference_id)
        SELECT 
            id,
            v_challenge.entry_fee,
            'entry_fee',
            'completed',
            v_match_id
        FROM unnest(ARRAY[v_challenge.challenger_id, v_challenge.opponent_id]) AS id;

        -- Update challenge status
        UPDATE challenges
        SET status = 'accepted'
        WHERE id = p_challenge_id;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction on error
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql;