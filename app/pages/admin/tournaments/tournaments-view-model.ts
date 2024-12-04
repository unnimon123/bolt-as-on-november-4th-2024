import { Observable, Frame } from '@nativescript/core';
import { TournamentManagementService } from '../../../services/tournament-management-service';
import { showActionDialog } from '../../../utils/dialogs';

export class TournamentsViewModel extends Observable {
    private _tournaments: any[] = [];
    private _currentFilter: string = 'all';

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

    async loadTournaments() {
        try {
            const tournaments = await TournamentManagementService.getTournaments(this._currentFilter);
            this.tournaments = tournaments;
        } catch (error) {
            console.error('Error loading tournaments:', error);
        }
    }

    async filterByStatus(args: any) {
        const button = args.object;
        this._currentFilter = button.text.toLowerCase().replace(' ', '_');
        await this.loadTournaments();
    }

    async showTournamentActions(args: any) {
        const tournament = this.tournaments[args.index];
        const result = await showActionDialog('Tournament Actions', [
            { id: 'view', text: 'View Details' },
            { id: 'edit', text: 'Edit Tournament' },
            { id: 'cancel', text: 'Cancel Tournament', destructive: true },
            { id: 'close', text: 'Close' }
        ]);

        switch (result) {
            case 'view':
                Frame.topmost().navigate({
                    moduleName: 'pages/admin/tournaments/tournament-detail-page',
                    context: { tournamentId: tournament.id }
                });
                break;
            case 'edit':
                Frame.topmost().navigate({
                    moduleName: 'pages/admin/tournaments/edit-tournament-page',
                    context: { tournament }
                });
                break;
            case 'cancel':
                await this.cancelTournament(tournament);
                break;
        }
    }

    private async cancelTournament(tournament: any) {
        try {
            await TournamentManagementService.cancelTournament(tournament.id);
            await this.loadTournaments();
        } catch (error) {
            console.error('Error canceling tournament:', error);
        }
    }

    createTournament() {
        Frame.topmost().navigate('pages/admin/tournaments/create-tournament-page');
    }

    onTournamentTap(args: any) {
        const tournament = this.tournaments[args.index];
        Frame.topmost().navigate({
            moduleName: 'pages/admin/tournaments/tournament-detail-page',
            context: { tournamentId: tournament.id }
        });
    }
}