import { Component, computed, DestroyRef, inject, resource, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NotifyService } from '../../core/notify.service';
import { LoadingIndicator } from '../../shared/loading-indicator';
import { ThemeService } from '../../core/theme.service';
import { SHARE_FORMATS, ShareCard, shareFileName, ShareFormat, ShareTheme } from './share-card';
import { renderShareCard } from './share-renderer';

export interface ShareDialogData {
  /** Builds the card data; may fetch (e.g. habit history). */
  card: () => Promise<ShareCard>;
  title: string;
}

/** Previews a shareable progress image and lets the user download or share it. */
@Component({
  selector: 'app-share-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    LoadingIndicator,
  ],
  templateUrl: './share-dialog.html',
  styleUrl: './share-dialog.scss',
})
export class ShareDialog {
  protected readonly data = inject<ShareDialogData>(MAT_DIALOG_DATA);
  private readonly notify = inject(NotifyService);

  protected readonly formats = Object.entries(SHARE_FORMATS) as [
    ShareFormat,
    (typeof SHARE_FORMATS)[ShareFormat],
  ][];
  protected readonly format = signal<ShareFormat>('square');
  protected readonly theme = signal<ShareTheme>(inject(ThemeService).theme());

  /** Card data is loaded once; re-rendering only changes format/theme. */
  private readonly cardPromise = this.data.card();
  private objectUrl: string | null = null;

  protected readonly image = resource({
    params: () => ({ format: this.format(), theme: this.theme() }),
    loader: async ({ params }) => {
      const card = await this.cardPromise;
      const blob = await renderShareCard(card, params.format, params.theme);
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = URL.createObjectURL(blob);
      return {
        blob,
        url: this.objectUrl,
        file: new File([blob], shareFileName(card), { type: 'image/png' }),
      };
    },
  });

  protected readonly ready = computed(() => this.image.hasValue() && !this.image.isLoading());
  protected readonly canCopy =
    typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function';
  protected readonly canShare = (() => {
    try {
      const probe = new File([''], 'atom.png', { type: 'image/png' });
      return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] });
    } catch {
      return false;
    }
  })();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    });
  }

  protected download(): void {
    const img = this.image.value();
    if (!img) return;
    const a = document.createElement('a');
    a.href = img.url;
    a.download = img.file.name;
    a.click();
  }

  protected async copy(): Promise<void> {
    const img = this.image.value();
    if (!img) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': img.blob })]);
      this.notify.info('Image copied — paste it into your post');
    } catch {
      this.notify.info('Your browser blocked copying the image. Try Download instead.');
    }
  }

  protected async share(): Promise<void> {
    const img = this.image.value();
    if (!img) return;
    try {
      await navigator.share({
        files: [img.file],
        title: this.data.title,
        text: 'Tiny habits, remarkable results. #AtomicHabits',
      });
    } catch (err) {
      // The user closing the share sheet is not an error.
      if ((err as DOMException)?.name !== 'AbortError') {
        this.notify.info('Sharing is not available here. Try Download instead.');
      }
    }
  }
}
