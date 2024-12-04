import type { Tournament } from '../supabase';

export class TournamentValidator {
    static validateTournamentCreation(tournament: Partial<Tournament>): string[] {
        const errors: string[] = [];

        if (!tournament.title?.trim()) {
            errors.push('Tournament title is required');
        }

        if (!tournament.game_type) {
            errors.push('Game type is required');
        }

        if (!tournament.entry_fee || tournament.entry_fee < 0) {
            errors.push('Entry fee must be a positive number');
        }

        if (!tournament.max_participants || tournament.max_participants < 4) {
            errors.push('Tournament must have at least 4 participants');
        }

        if (!tournament.start_time || new Date(tournament.start_time) <= new Date()) {
            errors.push('Start time must be in the future');
        }

        return errors;
    }

    static canJoinTournament(tournament: Tournament, userId: string, balance: number): string[] {
        const errors: string[] = [];

        if (tournament.status !== 'open') {
            errors.push('Tournament is not open for registration');
        }

        if (tournament.current_participants >= tournament.max_participants) {
            errors.push('Tournament is full');
        }

        if (balance < tournament.entry_fee) {
            errors.push('Insufficient balance');
        }

        return errors;
    }
}