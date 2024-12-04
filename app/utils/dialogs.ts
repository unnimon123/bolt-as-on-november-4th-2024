import { action } from '@nativescript/core/ui/dialogs';

interface ActionOption {
    id: string;
    text: string;
    destructive?: boolean;
}

export async function showActionDialog(
    title: string,
    options: ActionOption[]
): Promise<string> {
    const result = await action({
        title,
        actions: options.map(opt => opt.text),
        cancelButtonText: 'Cancel'
    });

    if (!result || result === 'Cancel') {
        return 'cancel';
    }

    const selectedOption = options.find(opt => opt.text === result);
    return selectedOption?.id || 'cancel';
}