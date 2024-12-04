import { Observable, Frame } from '@nativescript/core';
import { UserManagementService } from '../../../services/user-management-service';
import { showActionDialog } from '../../../utils/dialogs';

export class UsersViewModel extends Observable {
    private _users: any[] = [];
    private _searchQuery: string = '';
    private _isLoading: boolean = false;

    constructor() {
        super();
        this.loadUsers();
    }

    get users(): any[] {
        return this._users;
    }

    set users(value: any[]) {
        if (this._users !== value) {
            this._users = value;
            this.notifyPropertyChange('users', value);
        }
    }

    get searchQuery(): string {
        return this._searchQuery;
    }

    set searchQuery(value: string) {
        if (this._searchQuery !== value) {
            this._searchQuery = value;
            this.notifyPropertyChange('searchQuery', value);
            this.filterUsers();
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

    async loadUsers() {
        try {
            this.isLoading = true;
            const users = await UserManagementService.getUsers();
            this.users = users;
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async refreshUsers() {
        await this.loadUsers();
    }

    private filterUsers() {
        if (!this.searchQuery) {
            this.loadUsers();
            return;
        }

        const query = this.searchQuery.toLowerCase();
        this.users = this.users.filter(user => 
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
    }

    async showUserActions(args: any) {
        const user = this.users[args.index];
        const result = await showActionDialog('User Actions', [
            { id: 'view', text: 'View Details' },
            { id: 'suspend', text: user.is_suspended ? 'Unsuspend User' : 'Suspend User' },
            { id: 'delete', text: 'Delete User', destructive: true },
            { id: 'cancel', text: 'Cancel' }
        ]);

        switch (result) {
            case 'view':
                Frame.topmost().navigate({
                    moduleName: 'pages/admin/users/user-detail-page',
                    context: { userId: user.id }
                });
                break;
            case 'suspend':
                await this.toggleUserSuspension(user);
                break;
            case 'delete':
                await this.deleteUser(user);
                break;
        }
    }

    private async toggleUserSuspension(user: any) {
        try {
            await UserManagementService.toggleUserSuspension(user.id);
            await this.loadUsers();
        } catch (error) {
            console.error('Error toggling user suspension:', error);
        }
    }

    private async deleteUser(user: any) {
        try {
            await UserManagementService.deleteUser(user.id);
            await this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }

    showFilters() {
        // Implement filters dialog
    }

    onUserTap(args: any) {
        const user = this.users[args.index];
        Frame.topmost().navigate({
            moduleName: 'pages/admin/users/user-detail-page',
            context: { userId: user.id }
        });
    }
}