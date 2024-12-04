import { EventData, Page } from '@nativescript/core';
import { AdminViewModel } from './admin-view-model';

export function onNavigatingTo(args: EventData) {
    const page = <Page>args.object;
    page.bindingContext = new AdminViewModel();
}