import { httpResource } from '@angular/common/http';
import { booleanAttribute, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IdentitiesService } from '../../core/identities.service';
import type { Identity } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { ConfirmService } from '../../shared/confirm-dialog';
import { LoadingIndicator } from '../../shared/loading-indicator';
import { IdentityDialog } from './identity-dialog';

const EXAMPLES = [
  'I am a reader',
  'I am an athlete',
  'I am the type of person who keeps promises to myself',
  'I am a writer',
  'I am a healthy eater',
  'I am a non-smoker',
];

@Component({
  selector: 'app-identities',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule, LoadingIndicator],
  templateUrl: './identities.html',
  styleUrl: './identities.scss',
})
export class Identities {
  private readonly api = inject(IdentitiesService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);

  /** `?welcome=true` after registration shows onboarding guidance. */
  readonly welcome = input(false, { transform: booleanAttribute });

  protected readonly examples = EXAMPLES;
  protected readonly identities = httpResource<Identity[]>(() => this.api.url, {
    defaultValue: [],
  });
  protected readonly totalVotes = computed(() =>
    this.identities.value().reduce((sum, i) => sum + i.votes, 0),
  );

  protected share(identity: Identity): number {
    const total = this.totalVotes();
    return total ? Math.round((identity.votes / total) * 100) : 0;
  }

  protected async open(identity: Identity | null = null): Promise<void> {
    const ref = this.dialog.open(IdentityDialog, { data: identity, width: '520px' });
    const saved = await firstValueFrom(ref.afterClosed());
    if (saved) {
      this.notify.info(identity ? 'Identity updated' : 'Identity added');
      this.identities.reload();
    }
  }

  protected async addExample(statement: string): Promise<void> {
    try {
      await firstValueFrom(this.api.create({ statement, description: '' }));
      this.identities.reload();
    } catch (err) {
      this.notify.error(err);
    }
  }

  protected async remove(identity: Identity): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Remove this identity?',
      message: `“${identity.statement}” will be removed. Its ${identity.habitCount} linked habits are kept.`,
      confirm: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.api.delete(identity.id));
      this.identities.reload();
    } catch (err) {
      this.notify.error(err);
    }
  }
}
