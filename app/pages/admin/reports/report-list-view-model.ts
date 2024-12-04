import { Observable } from '@nativescript/core';
import { ReportHandler, Report } from '../../../services/admin/report-handler';
import { Frame } from '@nativescript/core';

export class ReportListViewModel extends Observable {
    private _reports: Report[] = [];
    private _selectedFilter: string = 'all';

    constructor() {
        super();
        this.loadReports();
    }

    get reports(): Report[] {
        return this._reports;
    }

    set reports(value: Report[]) {
        if (this._reports !== value) {
            this._reports = value;
            this.notifyPropertyChange('reports', value);
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

    async loadReports(): Promise<void> {
        try {
            const filters: any = {};
            
            if (this.selectedFilter === 'pending') {
                filters.status = 'pending';
            } else if (this.selectedFilter === 'high') {
                filters.priority = 'high';
            }

            this.reports = await ReportHandler.getReports(filters);
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }

    filterByStatus(args: any): void {
        const button = args.object;
        this.selectedFilter = button.text.toLowerCase();
        this.loadReports();
    }

    filterByPriority(args: any): void {
        this.selectedFilter = 'high';
        this.loadReports();
    }

    onReportTap(args: any): void {
        const report = this.reports[args.index];
        Frame.topmost().navigate({
            moduleName: 'pages/admin/reports/report-detail-page',
            context: { reportId: report.id }
        });
    }
}