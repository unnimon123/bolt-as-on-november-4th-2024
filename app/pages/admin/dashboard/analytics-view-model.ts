import { Observable } from '@nativescript/core';
import { AnalyticsDashboard } from '../../../services/admin/analytics-dashboard';
import { formatCurrency } from '../../../utils/formatters';

export class AnalyticsViewModel extends Observable {
    private _totalUsers: number = 0;
    private _activeTournaments: number = 0;
    private _totalRevenue: number = 0;
    private _disputeRate: number = 0;
    private _userGrowthChartUrl: string = '';
    private _revenueChartUrl: string = '';

    constructor() {
        super();
        this.loadDashboardData();
    }

    get totalUsers(): number {
        return this._totalUsers;
    }

    set totalUsers(value: number) {
        if (this._totalUsers !== value) {
            this._totalUsers = value;
            this.notifyPropertyChange('totalUsers', value);
        }
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

    get totalRevenue(): string {
        return formatCurrency(this._totalRevenue);
    }

    set totalRevenue(value: number) {
        if (this._totalRevenue !== value) {
            this._totalRevenue = value;
            this.notifyPropertyChange('totalRevenue', value);
        }
    }

    get disputeRate(): number {
        return Math.round(this._disputeRate * 100);
    }

    set disputeRate(value: number) {
        if (this._disputeRate !== value) {
            this._disputeRate = value;
            this.notifyPropertyChange('disputeRate', value);
        }
    }

    get userGrowthChartUrl(): string {
        return this._userGrowthChartUrl;
    }

    set userGrowthChartUrl(value: string) {
        if (this._userGrowthChartUrl !== value) {
            this._userGrowthChartUrl = value;
            this.notifyPropertyChange('userGrowthChartUrl', value);
        }
    }

    get revenueChartUrl(): string {
        return this._revenueChartUrl;
    }

    set revenueChartUrl(value: string) {
        if (this._revenueChartUrl !== value) {
            this._revenueChartUrl = value;
            this.notifyPropertyChange('revenueChartUrl', value);
        }
    }

    async loadDashboardData(): Promise<void> {
        try {
            const metrics = await AnalyticsDashboard.getDashboardMetrics();
            
            this.totalUsers = metrics.totalUsers;
            this.activeTournaments = metrics.activeTournaments;
            this.totalRevenue = metrics.totalRevenue;
            this.disputeRate = metrics.disputeRate;
            
            this.generateCharts(metrics);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    private generateCharts(metrics: any): void {
        // Generate Chart.js URLs for WebView
        this.userGrowthChartUrl = this.generateChartUrl({
            type: 'line',
            data: {
                labels: metrics.userGrowth.map((d: any) => d.date),
                datasets: [{
                    label: 'User Growth',
                    data: metrics.userGrowth.map((d: any) => d.count)
                }]
            }
        });

        this.revenueChartUrl = this.generateChartUrl({
            type: 'bar',
            data: {
                labels: metrics.revenueByDay.map((d: any) => d.date),
                datasets: [{
                    label: 'Daily Revenue',
                    data: metrics.revenueByDay.map((d: any) => d.amount)
                }]
            }
        });
    }

    private generateChartUrl(config: any): string {
        return `data:text/html,<canvas id="chart"></canvas>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script>
                new Chart(document.getElementById('chart'), ${JSON.stringify(config)});
            </script>`;
    }
}