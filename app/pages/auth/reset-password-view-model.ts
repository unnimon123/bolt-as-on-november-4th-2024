import { Observable, Frame } from '@nativescript/core';
import { supabase } from '../../services/supabase';
import { ErrorHandler } from '../../utils/error-handler';
import { passwordResetSchema } from '../../utils/validation';

export class ResetPasswordViewModel extends Observable {
    private _email: string = '';
    private _isLoading: boolean = false;

    constructor() {
        super();
    }

    get email(): string {
        return this._email;
    }

    set email(value: string) {
        if (this._email !== value) {
            this._email = value;
            this.notifyPropertyChange('email', value);
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

    async sendResetLink() {
        try {
            await passwordResetSchema.validate({ email: this.email });
            
            this.isLoading = true;
            const { error } = await supabase.auth.resetPasswordForEmail(this.email);
            
            if (error) throw error;

            alert({
                title: 'Success',
                message: 'Password reset instructions have been sent to your email.',
                okButtonText: 'OK'
            });

            Frame.topmost().goBack();
        } catch (error) {
            ErrorHandler.handle(error);
        } finally {
            this.isLoading = false;
        }
    }

    backToLogin() {
        Frame.topmost().goBack();
    }
}