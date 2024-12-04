import { Observable } from '@nativescript/core';
import { TournamentService } from '../../services/tournament-service';
import { MatchService } from '../../services/match-service';
import { ChatService } from '../../services/chat-service';
import { authService } from '../../services/auth-service';
import type { Tournament, Match, Profile } from '../../services/supabase';

export class TournamentDetailViewModel extends Observable {
    private _tournament: Tournament | null = null;
    private _matches: Match[] = [];
    private _participants: Profile[] = [];
    private _chatMessages: any[] = [];
    private _chatMessage: string = '';
    private _selectedTabIndex: number = 0;
    private _isChatVisible: boolean = false;
    private _canJoin: boolean = false;
    private _isParticipant: boolean = false;

    constructor(private tournamentId: string) {
        super();
        this.loadTournamentDetails();
        this.setupChatSubscription();
    }

    // ... (previous getters/setters remain the same)

    get isChatVisible(): boolean {
        return this._isChatVisible;
    }

    set isChatVisible(value: boolean) {
        if (this._isChatVisible !== value) {
            this._isChatVisible = value;
            this.notifyPropertyChange('isChatVisible', value);
        }
    }

    get chatMessage(): string {
        return this._chatMessage;
    }

    set chatMessage(value: string) {
        if (this._chatMessage !== value) {
            this._chatMessage = value;
            this.notifyPropertyChange('chatMessage', value);
        }
    }

    async loadTournamentDetails() {
        try {
            const [tournament, matches, participants] = await Promise.all([
                TournamentService.getTournamentDetails(this.tournamentId),
                MatchService.getMatchesByTournament(this.tournamentId),
                TournamentService.getTournamentParticipants(this.tournamentId)
            ]);

            this.tournament = tournament;
            this.matches = this.processMatches(matches);
            this.participants = participants;
            
            const currentUserId = authService.currentUser?.id;
            this._isParticipant = participants.some(p => p.id === currentUserId);
            this._canJoin = this.checkCanJoin();
            
            this.notifyPropertyChange('isParticipant', this._isParticipant);
            this.notifyPropertyChange('canJoin', this._canJoin);
        } catch (error) {
            console.error('Failed to load tournament details:', error);
        }
    }

    private processMatches(matches: Match[]): any[] {
        return matches.map(match => ({
            ...match,
            statusClass: this.getStatusClass(match.status),
            score: match.status === 'completed' ? 
                `${match.player1_score} - ${match.player2_score}` : ''
        }));
    }

    private getStatusClass(status: string): string {
        switch (status) {
            case 'scheduled': return 'primary';
            case 'in_progress': return 'warning';
            case 'completed': return 'success';
            case 'disputed': return 'danger';
            default: return 'secondary';
        }
    }

    private checkCanJoin(): boolean {
        if (!this._tournament) return false;
        return (
            !this._isParticipant &&
            this._tournament.status === 'open' &&
            this._tournament.current_participants < this._tournament.max_participants
        );
    }

    async joinTournament() {
        try {
            await TournamentService.joinTournament(this.tournamentId, authService.currentUser!.id);
            await this.loadTournamentDetails();
        } catch (error) {
            console.error('Failed to join tournament:', error);
        }
    }

    showGameIds() {
        // Implementation for showing game IDs dialog
    }

    toggleChat() {
        this.isChatVisible = !this.isChatVisible;
    }

    private setupChatSubscription() {
        ChatService.getInstance().subscribeToChatMessages(this.tournamentId, (message) => {
            this._chatMessages = [...this._chatMessages, message];
            this.notifyPropertyChange('chatMessages', this._chatMessages);
        });
    }

    async sendChatMessage() {
        if (!this.chatMessage.trim()) return;

        try {
            await ChatService.getInstance().sendMessage(
                this.tournamentId,
                authService.currentUser!.id,
                this.chatMessage.trim()
            );
            this.chatMessage = '';
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    onMatchTap(args: any) {
        const match = this.matches[args.index];
        const frame = require('@nativescript/core').Frame;
        frame.topmost().navigate({
            moduleName: 'pages/matches/match-detail-page',
            context: { matchId: match.id }
        });
    }
}