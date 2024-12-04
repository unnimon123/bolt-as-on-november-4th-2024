import { Observable } from '@nativescript/core';
import { DisputeHandler } from '../../../services/match/dispute-handler';
import { StorageService } from '../../../services/storage-service';

export class DisputeFormModel extends Observable {
    private _reason: string = '';
    private _evidenceUrl: string | null = null;
    private _evidenceFileName: string = '';
    private _isSubmitting: boolean = false;

    constructor(private matchId: string, private onSubmitComplete?: () => void) {
        super();
    }

    get reason(): string {
        return this._reason;
    }

    set reason(value: string) {
        if (this._reason !== value) {
            this._reason = value;
            this.notifyPropertyChange('reason', value);
            this.notifyPropertyChange('isValid');
        }
    }

    get evidenceFileName(): string {
        return this._evidenceFileName;
    }

    get isValid(): boolean {
        return this._reason.length >= 10;
    }

    async uploadEvidence(): Promise<void> {
        try {
            // Implementation for file picker and upload
            const fileUri = ''; // Get from file picker
            this._evidenceUrl = await StorageService.uploadDisputeEvidence(this.matchId, fileUri);
            this._evidenceFileName = fileUri.split('/').pop() || '';
            this.notifyPropertyChange('evidenceFileName');
        } catch (error) {
            console.error('Error uploading evidence:', error);
        }
    }

    async submitDispute(): Promise<void> {
        if (!this.isValid || this._isSubmitting) return;

        try {
            this._isSubmitting = true;
            this.notifyPropertyChange('isSubmitting');

            await DisputeHandler.createDispute({
                matchId: this.matchId,
                reason: this.reason,
                evidence: this._evidenceUrl
            });

            if (this.onSubmitComplete) {
                this.onSubmitComplete();
            }
        } catch (error) {
            console.error('Error submitting dispute:', error);
        } finally {
            this._isSubmitting = false;
            this.notifyPropertyChange('isSubmitting');
        }
    }
}