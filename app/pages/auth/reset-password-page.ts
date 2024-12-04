import { EventData, Page } from '@nativescript/core';
import { ResetPasswordViewModel } from './reset-password-view-model';

export function onNavigatingTo(args: EventData) {
    const page = <Page>args.object;
    page.bindingContext = new ResetPasswordViewModel();
}