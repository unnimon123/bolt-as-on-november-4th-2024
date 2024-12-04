import { Observable } from '@nativescript/core';
import { Frame } from '@nativescript/core';
import { AdminService } from '../../services/admin-service';

interface ActivityItem {
    icon: string;
    title: string;
    description: string;
    timeAgo: string;
}

export class AdminViewModel extends Observable {
    private _activeTournaments: number = 0;
    private _activeUsers: number = 0;
    private _pendingDisputes: number = 0;
    private _recentActivity: ActivityItem[] = [];

    constructor() {
        super();
        this.loadDashboardData();
    }

    get activeTournaments(): number {
        return this._activeTournaments;
    }

    set activeTournaments(value: number) {
        if (this._activeTournaments !== value) {
            this._activeTournaments = value;
            this.notifyPropertyChange('activeTournaments', value);
        }
    }

    get activeUsers(): number {
        return this._activeUsers;
    }

    set activeUsers(value: number) {
        if (this._activeUsers !== value) {
            this._activeUsers = value;
            this.notifyPropertyChange('activeUsers', value);
        }
    }

    get pendingDisputes(): number {
        return this._pendingDisputes;
    }

    set pendingDisputes(value: number) {
        if (this._pendingDisputes !== value) {
            this._pendingDisputes = value;
            this.notifyPropertyChange('pendingDisputes', value);
        }
    }

    get recentActivity(): ActivityItem[] {
        return this._recentActivity;
    }

    set recentActivity(value: ActivityItem[]) {
        if (this._recentActivity !== value) {
            this._recentActivity = value;
            this.notifyPropertyChange('recentActivity', value);
        }
    }

    async loadDashboardData() {
        try {
            const stats = await AdminService.getDashboardStats();
            this.activeTournaments = stats.activeTournaments;
            this.activeUsers = stats.activeUsers;
            this.pendingDisputes = stats.pendingDisputes;
            
            const activity = await AdminService.getRecentActivity();
            this.recentActivity = activity.map(item => ({
                ...item,
                timeAgo: this.getTimeAgo(new Date(item.timestamp))
            }));
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    navigateToUsers() {
        Frame.topmost().navigate('pages/admin/users/users-page');
    }

    navigateToTournaments() {
        Frame.topmost().navigate('pages/admin/tournaments/tournaments-page');
    }

    navigateToDisputes() {
        Frame.topmost().navigate('pages/admin/disputes/disputes-page');
    }

    navigateToReports() {
        Frame.topmost().navigate('pages/admin/reports/reports-page');
    }

    private getTimeAgo(date: Date): string {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
}