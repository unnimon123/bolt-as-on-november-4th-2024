import { Observable } from '@nativescript/core';
import { ChallengeService } from '../../../services/matchmaking/challenge-service';
import { authService } from '../../../services/auth-service';
import { showActionDialog } from '../../../utils/dialogs';

export class ChallengeViewModel extends Observable {
    private _searchQuery: string = '';
    private _players: any[] = [];
    private readonly ENTRY_FEE_OPTIONS = [1, 5, 10];
    private readonly GAME_OPTIONS = ['Fortnite', 'FIFA', 'COD'];

    constructor() {
        super();
    }

    get searchQuery(): string {
        return this._searchQuery;
    }

    set searchQuery(value: string) {
        if (this._searchQuery !== value) {
            this._searchQuery = value;
            this.notifyPropertyChange('searchQuery', value);
        }
    }

    get players(): any[] {
        return this._players;
    }

    set players(value: any[]) {
        if (this._players !== value) {
            this._players = value;
            this.notifyPropertyChange('players', value);
        }
    }

    async searchPlayers() {
        if (!this.searchQuery.trim()) return;

        try {
            this.players = await ChallengeService.searchPlayers(this.searchQuery.trim());
        } catch (error) {
            console.error('Error searching players:', error);
            alert({
                title: 'Error',
                message: 'Failed to search players. Please try again.',
                okButtonText: 'OK'
            });
        }
    }

    async showChallengeOptions(args: any) {
        const player = this.players[args.index];

        // Select game
        const gameResult = await showActionDialog('Select Game', 
            this.GAME_OPTIONS.map(game => ({ id: game, text: game }))
        );
        if (gameResult === 'cancel') return;

        // Select entry fee
        const feeResult = await showActionDialog('Select Entry Fee',
            this.ENTRY_FEE_OPTIONS.map(fee => ({ id: fee.toString(), text: `$${fee}` }))
        );
        if (feeResult === 'cancel') return;

        // Send challenge
        try {
            await ChallengeService.sendChallenge({
                challengerId: authService.currentUser!.id,
                opponentId: player.id,
                gameType: gameResult,
                entryFee: parseInt(feeResult)
            });

            alert({
                title: 'Challenge Sent',
                message: `Challenge sent to ${player.username}`,
                okButtonText: 'OK'
            });
        } catch (error) {
            console.error('Error sending challenge:', error);
            alert({
                title: 'Error',
                message: 'Failed to send challenge. Please try again.',
                okButtonText: 'OK'
            });
        }
    }
}