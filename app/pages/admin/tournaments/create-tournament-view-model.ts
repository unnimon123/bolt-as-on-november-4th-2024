import { Observable } from '@nativescript/core';
import { TournamentManagementService } from '../../../services/tournament-management-service';
import { ProfileService } from '../../../services/profile-service';
import { Frame } from '@nativescript/core';

export class CreateTournamentViewModel extends Observable {
    private _title: string = '';
    private _gameType: string = '';
    private _entryFee: number = 0;
    private _maxParticipants: number = 0;
    private _startTime: Date = new Date();
    private _searchQuery: string = '';
    private _availablePlayers: any[] = [];
    private _selectedPlayers: any[] = [];
    private _isLoading: boolean = false;

    constructor() {
        super();
        this.loadPlayers();
    }

    // Getters and setters for observable properties
    get title(): string {
        return this._title;
    }

    set title(value: string) {
        if (this._title !== value) {
            this._title = value;
            this.notifyPropertyChange('title', value);
            this.notifyPropertyChange('isValid');
        }
    }

    // ... Similar getters/setters for other properties

    get isValid(): boolean {
        return (
            this._title.length >= 3 &&
            this._gameType !== '' &&
            this._entryFee >= 0 &&
            this._maxParticipants >= 2 &&
            this._selectedPlayers.length >= 2 &&
            this._selectedPlayers.length <= this._maxParticipants &&
            this._startTime > new Date()
        );
    }

    async loadPlayers() {
        try {
            this._isLoading = true;
            const players = await ProfileService.getActivePlayers();
            this._availablePlayers = players.map(player => ({
                ...player,
                isSelected: false
            }));
            this.notifyPropertyChange('availablePlayers');
        } catch (error) {
            console.error('Error loading players:', error);
        } finally {
            this._isLoading = false;
            this.notifyPropertyChange('isLoading');
        }
    }

    async searchPlayers() {
        if (!this._searchQuery) {
            await this.loadPlayers();
            return;
        }

        const query = this._searchQuery.toLowerCase();
        this._availablePlayers = this._availablePlayers.filter(player =>
            player.username.toLowerCase().includes(query) ||
            player.game_id?.toLowerCase().includes(query)
        );
        this.notifyPropertyChange('availablePlayers');
    }

    togglePlayerSelection(args: any) {
        const player = this._availablePlayers[args.index];
        player.isSelected = !player.isSelected;

        if (player.isSelected) {
            this._selectedPlayers.push(player);
        } else {
            this._selectedPlayers = this._selectedPlayers.filter(p => p.id !== player.id);
        }

        this.notifyPropertyChange('selectedPlayers');
        this.notifyPropertyChange('isValid');
    }

    removePlayer(args: any) {
        const player = this._selectedPlayers[args.index];
        const availablePlayer = this._availablePlayers.find(p => p.id === player.id);
        if (availablePlayer) {
            availablePlayer.isSelected = false;
        }

        this._selectedPlayers.splice(args.index, 1);
        this.notifyPropertyChange('selectedPlayers');
        this.notifyPropertyChange('availablePlayers');
        this.notifyPropertyChange('isValid');
    }

    async createTournament() {
        if (!this.isValid) return;

        try {
            this._isLoading = true;
            this.notifyPropertyChange('isLoading');

            const tournament = await TournamentManagementService.createTournament({
                title: this._title,
                game_type: this._gameType,
                entry_fee: this._entryFee,
                max_participants: this._maxParticipants,
                start_time: this._startTime.toISOString(),
                participants: this._selectedPlayers.map(p => p.id)
            });

            alert({
                title: 'Success',
                message: 'Tournament created successfully!',
                okButtonText: 'OK'
            });

            Frame.topmost().goBack();
        } catch (error) {
            console.error('Error creating tournament:', error);
            alert({
                title: 'Error',
                message: 'Failed to create tournament. Please try again.',
                okButtonText: 'OK'
            });
        } finally {
            this._isLoading = false;
            this.notifyPropertyChange('isLoading');
        }
    }
}