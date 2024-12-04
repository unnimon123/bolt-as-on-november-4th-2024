-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    game_id TEXT,
    avatar_url TEXT,
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    rating INTEGER DEFAULT 1000,
    is_online BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    game_type TEXT NOT NULL,
    entry_fee DECIMAL(10,2) NOT NULL,
    prize_pool DECIMAL(10,2) NOT NULL,
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    min_rating INTEGER,
    max_rating INTEGER,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'open',
    creator_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled'))
);

-- Create tournament_participants table
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id),
    player_id UUID REFERENCES profiles(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(tournament_id, player_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id),
    player1_id UUID REFERENCES profiles(id),
    player2_id UUID REFERENCES profiles(id),
    player1_score INTEGER,
    player2_score INTEGER,
    winner_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'scheduled',
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_match_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'disputed'))
);

-- Create casual_matches table
CREATE TABLE IF NOT EXISTS casual_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player1_id UUID REFERENCES profiles(id),
    player2_id UUID REFERENCES profiles(id),
    game_type TEXT NOT NULL,
    entry_fee DECIMAL(10,2) NOT NULL,
    prize_pool DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    player1_score INTEGER,
    player2_score INTEGER,
    winner_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_casual_match_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'disputed'))
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_transaction_type CHECK (type IN ('deposit', 'withdrawal', 'entry_fee', 'prize', 'platform_fee')),
    CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'completed', 'failed'))
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_notification_type CHECK (type IN ('match_invite', 'tournament_start', 'match_result', 'prize_won'))
);

-- Create indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_game_id ON profiles(game_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_players ON matches(player1_id, player2_id);
CREATE INDEX idx_transactions_user ON transactions(user_id, type);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);