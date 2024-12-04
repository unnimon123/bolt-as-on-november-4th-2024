import { supabase } from './supabase';

export class TournamentManagementService {
    static async createTournament(tournamentData: any) {
        const { data: tournament, error: tournamentError } = await supabase
            .from('tournaments')
            .insert([{
                title: tournamentData.title,
                game_type: tournamentData.game_type,
                entry_fee: tournamentData.entry_fee,
                max_participants: tournamentData.max_participants,
                start_time: tournamentData.start_time,
                status: 'upcoming'
            }])
            .select()
            .single();

        if (tournamentError) throw tournamentError;

        // Add participants
        const participantPromises = tournamentData.participants.map(async (playerId: string) => {
            const { error } = await supabase
                .from('tournament_participants')
                .insert([{
                    tournament_id: tournament.id,
                    player_id: playerId
                }]);

            if (error) throw error;
        });

        await Promise.all(participantPromises);

        // Update tournament participant count
        const { error: updateError } = await supabase
            .from('tournaments')
            .update({
                current_participants: tournamentData.participants.length
            })
            .eq('id', tournament.id);

        if (updateError) throw updateError;

        return tournament;
    }

    static async getTournaments(filter: string = 'all') {
        let query = supabase
            .from('tournaments')
            .select(`
                *,
                tournament_participants (
                    player:profiles (*)
                )
            `)
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    static async getTournamentDetails(tournamentId: string) {
        const { data, error } = await supabase
            .from('tournaments')
            .select(`
                *,
                tournament_participants (
                    player:profiles (*)
                ),
                matches (*)
            `)
            .eq('id', tournamentId)
            .single();

        if (error) throw error;
        return data;
    }

    static async updateTournament(tournamentId: string, updates: any) {
        const { error } = await supabase
            .from('tournaments')
            .update(updates)
            .eq('id', tournamentId);

        if (error) throw error;
    }

    static async cancelTournament(tournamentId: string) {
        const { error } = await supabase
            .from('tournaments')
            .update({ status: 'cancelled' })
            .eq('id', tournamentId);

        if (error) throw error;
    }

    static async generateMatches(tournamentId: string) {
        const { data: participants, error: participantsError } = await supabase
            .from('tournament_participants')
            .select('player_id')
            .eq('tournament_id', tournamentId);

        if (participantsError) throw participantsError;

        const playerIds = participants.map(p => p.player_id);
        const matches = this.generateMatchPairs(playerIds);

        const matchPromises = matches.map(async (match, index) => {
            const { error } = await supabase
                .from('matches')
                .insert([{
                    tournament_id: tournamentId,
                    player1_id: match[0],
                    player2_id: match[1],
                    round: 1,
                    match_order: index + 1,
                    status: 'scheduled',
                    scheduled_time: new Date().toISOString()
                }]);

            if (error) throw error;
        });

        await Promise.all(matchPromises);
    }

    private static generateMatchPairs(playerIds: string[]): [string, string][] {
        const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
        const pairs: [string, string][] = [];
        
        for (let i = 0; i < shuffled.length - 1; i += 2) {
            pairs.push([shuffled[i], shuffled[i + 1]]);
        }
        
        return pairs;
    }
}