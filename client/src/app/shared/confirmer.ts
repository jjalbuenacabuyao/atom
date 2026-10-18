import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmData, ConfirmDialog } from './confirm-dialog';

/** Opens a confirmation dialog and resolves to the user's choice. */
@Service()
export class Confirmer {
  private readonly dialog = inject(MatDialog);

  async ask(data: ConfirmData): Promise<boolean> {
    const ref = this.dialog.open<ConfirmDialog, ConfirmData, boolean>(ConfirmDialog, {
      data,
      width: '420px',
      autoFocus: 'dialog',
    });
    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
