import { Observable } from '@nativescript/core';
import { TournamentManagementService } from '../../../../services/tournament-management-service';
import { showActionDialog } from '../../../../utils/dialogs';
import { formatDateTime } from '../../../../utils/date-formatters';

export class TournamentListViewModel extends Observable {
    private _tournaments: any[] = [];
    private _selectedFilter: string = 'all';
    private _isLoading: boolean = false;

    constructor() {
        super();
        this.loadTournaments();
    }

    get tournaments(): any[] {
        return this._tournaments;
    }

    set tournaments(value: any[]) {
        if (this._tournaments !== value) {
            this._tournaments = value;
            this.notifyPropertyChange('tournaments', value);
        }
    }

    get selectedFilter(): string {
        return this._selectedFilter;
    }

    set selectedFilter(value: string) {
        if (this._selectedFilter !== value) {
            this._selectedFilter = value;
            this.notifyPropertyChange('selectedFilter', value);
        }
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    async loadTournaments() {
        try {
            this.isLoading = true;
            const tournaments = await TournamentManagementService.getTournaments(this.selectedFilter);
            this.tournaments = tournaments.map(tournament => ({
                ...tournament,
                statusClass: this.getStatusClass(tournament.status),
                formattedDateTime: formatDateTime(tournament.start_time)
            }));
        } catch (error) {
            console.error('Error loading tournaments:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async filterByStatus(args: any) {
        const button = args.object;
        this.selectedFilter = button.text.toLowerCase();
        await this.loadTournaments();
    }

    async showTournamentActions(args: any) {
        const tournament = this.tournaments[args.index];
        const result = await showActionDialog('Tournament Actions', [
            { id: 'view', text: 'View Details' },
            { id: 'edit', text: 'Edit Tournament' },
            { id: 'manage', text: 'Manage Participants' },
            { id: 'cancel', text: 'Cancel Tournament', destructive: true }
        ]);

        switch (result) {
            case 'view':
                this.navigateToDetails(tournament.id);
                break;
            case 'edit':
                this.navigateToEdit(tournament.id);
                break;
            case 'manage':
                this.navigateToParticipants(tournament.id);
                break;
            case 'cancel':
                await this.cancelTournament(tournament.id);
                break;
        }
    }

    private getStatusClass(status: string): string {
        switch (status) {
            case 'upcoming':
                return 'primary';
            case 'live':
                return 'success';
            case 'completed':
                return 'secondary';
            default:
                return 'default';
        }
    }

    private navigateToDetails(tournamentId: string) {
        // Navigation implementation
    }

    private navigateToEdit(tournamentId: string) {
        // Navigation implementation
    }

    private navigateToParticipants(tournamentId: string) {
        // Navigation implementation
    }

    private async cancelTournament(tournamentId: string) {
        try {
            await TournamentManagementService.cancelTournament(tournamentId);
            await this.loadTournaments();
        } catch (error) {
            console.error('Error canceling tournament:', error);
        }
    }
}