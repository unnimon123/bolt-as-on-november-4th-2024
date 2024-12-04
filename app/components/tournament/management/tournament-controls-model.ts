import { Observable } from '@nativescript/core';
import { TournamentManagementService } from '../../../services/tournament-management-service';

export class TournamentControlsModel extends Observable {
    private _tournament: any;

    constructor(tournament: any) {
        super();
        this._tournament = tournament;
    }

    get currentPlayers(): number {
        return this._tournament.current_participants;
    }

    get maxPlayers(): number {
        return this._tournament.max_participants;
    }

    get prizePool(): number {
        return this._tournament.prize_pool;
    }

    get status(): string {
        return this._tournament.status;
    }

    get canStart(): boolean {
        return this.status === 'open' && this.currentPlayers >= 2;
    }

    get canPause(): boolean {
        return this.status === 'in_progress';
    }

    get canCancel(): boolean {
        return this.status !== 'completed' && this.status !== 'cancelled';
    }

    async startTournament(): Promise<void> {
        try {
            await TournamentManagementService.updateTournament(
                this._tournament.id,
                { status: 'in_progress' }
            );
            this._tournament.status = 'in_progress';
            this.notifyPropertyChange('status');
            this.notifyPropertyChange('canStart');
            this.notifyPropertyChange('canPause');
        } catch (error) {
            console.error('Error starting tournament:', error);
        }
    }

    async pauseTournament(): Promise<void> {
        try {
            await TournamentManagementService.updateTournament(
                this._tournament.id,
                { status: 'paused' }
            );
            this._tournament.status = 'paused';
            this.notifyPropertyChange('status');
            this.notifyPropertyChange('canPause');
        } catch (error) {
            console.error('Error pausing tournament:', error);
        }
    }

    async cancelTournament(): Promise<void> {
        try {
            await TournamentManagementService.cancelTournament(this._tournament.id);
            this._tournament.status = 'cancelled';
            this.notifyPropertyChange('status');
            this.notifyPropertyChange('canStart');
            this.notifyPropertyChange('canPause');
            this.notifyPropertyChange('canCancel');
        } catch (error) {
            console.error('Error cancelling tournament:', error);
        }
    }
}