import { Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { IdentitiesService } from '../../core/identities.service';
import type { Identity } from '../../core/models';
import { toServerErrors } from '../../shared/form-errors';

/** Creates or edits an identity statement. Closes with the saved identity. */
@Component({
  selector: 'app-identity-dialog',
  imports: [FormField, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <form (submit)="onSubmit($event)" novalidate>
      <h2 mat-dialog-title>{{ data ? 'Edit identity' : 'Who do you want to become?' }}</h2>
      <mat-dialog-content>
        @for (error of identityForm().errors(); track error) {
          <p class="error" role="alert">{{ error.message }}</p>
        }
        <mat-form-field class="full-width">
          <mat-label>I am…</mat-label>
          <input
            matInput
            [formField]="identityForm.statement"
            placeholder="I am the type of person who never misses a workout"
          />
          @if (identityForm.statement().errors()[0]; as error) {
            <mat-error>{{ error.message }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field class="full-width">
          <mat-label>Why it matters (optional)</mat-label>
          <textarea matInput rows="3" [formField]="identityForm.description"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit" [disabled]="identityForm().submitting()">
          {{ data ? 'Save' : 'Add identity' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-dialog-content {
      padding-top: 8px !important;
    }
    .error {
      color: var(--mat-sys-error);
    }
  `,
})
export class IdentityDialog {
  protected readonly data = inject<Identity | null>(MAT_DIALOG_DATA);
  private readonly api = inject(IdentitiesService);
  private readonly ref = inject<MatDialogRef<IdentityDialog, Identity>>(MatDialogRef);

  protected readonly model = signal({
    statement: this.data?.statement ?? '',
    description: this.data?.description ?? '',
  });
  protected readonly identityForm = form(this.model, (p) => {
    required(p.statement, { message: 'Describe the person you want to become' });
    maxLength(p.statement, 160, { message: 'Keep it under 160 characters' });
    maxLength(p.description, 1000);
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.identityForm, async () => {
      try {
        const saved = await firstValueFrom(
          this.data ? this.api.update(this.data.id, this.model()) : this.api.create(this.model()),
        );
        this.ref.close(saved);
        return undefined;
      } catch (err) {
        return toServerErrors(this.identityForm, err);
      }
    });
  }
}
