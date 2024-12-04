import { Observable } from '@nativescript/core';
import { QuickMatchService } from '../../../services/matchmaking/quick-match-service';
import { authService } from '../../../services/auth-service';

export class QuickMatchViewModel extends Observable {
    private _selectedGame: string = '';
    private _entryFee: number = 0;
    private _isSearching: boolean = false;
    private _matchFound: boolean = false;
    private _opponent: any = null;
    private _currentSkillRange: number = 100;
    private _searchTimeLeft: string = '';
    private searchStartTime: number = 0;
    private updateInterval: any;
    private quickMatchService: QuickMatchService;

    constructor() {
        super();
        this.quickMatchService = QuickMatchService.getInstance();
        this.setupQuickMatchListeners();
    }

    get selectedGame(): string {
        return this._selectedGame;
    }

    set selectedGame(value: string) {
        if (this._selectedGame !== value) {
            this._selectedGame = value;
            this.notifyPropertyChange('selectedGame', value);
        }
    }

    get entryFee(): number {
        return this._entryFee;
    }

    set entryFee(value: number) {
        if (this._entryFee !== value) {
            this._entryFee = value;
            this.notifyPropertyChange('entryFee', value);
        }
    }

    get isSearching(): boolean {
        return this._isSearching;
    }

    set isSearching(value: boolean) {
        if (this._isSearching !== value) {
            this._isSearching = value;
            this.notifyPropertyChange('isSearching', value);
        }
    }

    get matchFound(): boolean {
        return this._matchFound;
    }

    set matchFound(value: boolean) {
        if (this._matchFound !== value) {
            this._matchFound = value;
            this.notifyPropertyChange('matchFound', value);
        }
    }

    get opponent(): any {
        return this._opponent;
    }

    set opponent(value: any) {
        if (this._opponent !== value) {
            this._opponent = value;
            this.notifyPropertyChange('opponent', value);
        }
    }

    get currentSkillRange(): number {
        return this._currentSkillRange;
    }

    set currentSkillRange(value: number) {
        if (this._currentSkillRange !== value) {
            this._currentSkillRange = value;
            this.notifyPropertyChange('currentSkillRange', value);
        }
    }

    get searchTimeLeft(): string {
        return this._searchTimeLeft;
    }

    set searchTimeLeft(value: string) {
        if (this._searchTimeLeft !== value) {
            this._searchTimeLeft = value;
            this.notifyPropertyChange('searchTimeLeft', value);
        }
    }

    selectGame(args: any) {
        const button = args.object;
        this.selectedGame = button.text;
    }

    selectFee(args: any) {
        const button = args.object;
        this.entryFee = parseInt(button.text.replace('$', ''));
    }

    async toggleSearch() {
        if (this.isSearching) {
            this.stopSearch();
        } else {
            await this.startSearch();
        }
    }

    private async startSearch() {
        this.isSearching = true;
        this.searchStartTime = Date.now();
        this.currentSkillRange = 100;
        this.startTimeLeftCounter();

        await this.quickMatchService.startSearch({
            userId: authService.currentUser!.id,
            gameType: this.selectedGame,
            entryFee: this.entryFee,
            skillRange: this.currentSkillRange
        });
    }

    private stopSearch() {
        this.quickMatchService.stopSearch();
        this.isSearching = false;
        this.matchFound = false;
        this.opponent = null;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    private setupQuickMatchListeners() {
        this.quickMatchService.on('matchFound', (match: any) => {
            this.matchFound = true;
            this.isSearching = false;
            this.opponent = match.opponent;
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
        });

        this.quickMatchService.on('searchTimeout', () => {
            this.stopSearch();
            alert({
                title: 'Search Timeout',
                message: 'No opponent found. Please try again.',
                okButtonText: 'OK'
            });
        });
    }

    private startTimeLeftCounter() {
        this.updateInterval = setInterval(() => {
            const elapsed = Date.now() - this.searchStartTime;
            const remaining = 300000 - elapsed; // 5 minutes timeout
            if (remaining <= 0) {
                clearInterval(this.updateInterval);
                return;
            }

            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            this.searchTimeLeft = `Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Update skill range every 30 seconds
            if (elapsed > 0 && elapsed % 30000 === 0) {
                this.currentSkillRange = Math.min(500, this.currentSkillRange + 50);
            }
        }, 1000);
    }
}