-- Enable real-time for specific tables
BEGIN;

-- Enable real-time for matches table
ALTER PUBLICATION supabase_realtime
ADD TABLE matches;

-- Enable real-time for tournaments table
ALTER PUBLICATION supabase_realtime
ADD TABLE tournaments;

-- Enable real-time for chat_messages table
ALTER PUBLICATION supabase_realtime
ADD TABLE chat_messages;

-- Create function to notify about match updates
CREATE OR REPLACE FUNCTION notify_match_update()
RETURNS TRIGGER AS $$
BEGIN
  perform pg_notify(
    'match_updates',
    json_build_object(
      'match_id', NEW.id,
      'status', NEW.status,
      'player1_score', NEW.player1_score,
      'player2_score', NEW.player2_score,
      'winner_id', NEW.winner_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for match updates
CREATE TRIGGER match_update_trigger
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION notify_match_update();

-- Create function to notify about tournament updates
CREATE OR REPLACE FUNCTION notify_tournament_update()
RETURNS TRIGGER AS $$
BEGIN
  perform pg_notify(
    'tournament_updates',
    json_build_object(
      'tournament_id', NEW.id,
      'status', NEW.status,
      'current_participants', NEW.current_participants
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tournament updates
CREATE TRIGGER tournament_update_trigger
AFTER UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION notify_tournament_update();

COMMIT;