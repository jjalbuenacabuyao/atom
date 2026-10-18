import { inject, Service } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorMessage } from './api';

/** Thin wrapper around MatSnackBar for consistent feedback messages. */
@Service()
export class Notifier {
  private readonly snackBar = inject(MatSnackBar);

  info(message: string, action?: string, onAction?: () => void): void {
    const ref = this.snackBar.open(message, action, { duration: action ? 6000 : 3000 });
    if (onAction) ref.onAction().subscribe(onAction);
  }

  error(err: unknown, fallback?: string): void {
    this.snackBar.open(errorMessage(err, fallback), 'Dismiss', { duration: 6000 });
  }
}
