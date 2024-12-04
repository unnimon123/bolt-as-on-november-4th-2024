-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Tournament participant count trigger
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tournaments
        SET current_participants = current_participants + 1
        WHERE id = NEW.tournament_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tournaments
        SET current_participants = current_participants - 1
        WHERE id = OLD.tournament_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tournament_participant_count
    AFTER INSERT OR DELETE ON tournament_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_tournament_participant_count();

-- Match completion trigger
CREATE OR REPLACE FUNCTION process_match_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update player ratings
        PERFORM update_player_ratings(
            NEW.player1_id,
            NEW.player2_id,
            NEW.winner_id
        );
        
        -- Process prize distribution for casual matches
        IF NEW.tournament_id IS NULL THEN
            PERFORM process_casual_match_prize(NEW.id);
        END IF;
        
        NEW.completed_at = TIMEZONE('utc'::text, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_completion
    BEFORE UPDATE ON matches
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION process_match_completion();

CREATE TRIGGER casual_match_completion
    BEFORE UPDATE ON casual_matches
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION process_match_completion();