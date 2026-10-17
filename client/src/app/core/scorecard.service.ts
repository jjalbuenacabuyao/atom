import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api';
import type { ScorecardEntry, ScorecardInput } from './models';

/** Typed client for Habits Scorecard endpoints. */
@Injectable({ providedIn: 'root' })
export class ScorecardService {
  private readonly http = inject(HttpClient);
  readonly url = `${inject(API_BASE_URL)}/scorecard`;

  create(input: ScorecardInput): Observable<ScorecardEntry> {
    return this.http.post<ScorecardEntry>(this.url, input);
  }

  update(id: string, input: ScorecardInput): Observable<ScorecardEntry> {
    return this.http.put<ScorecardEntry>(`${this.url}/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
