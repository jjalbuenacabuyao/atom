import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api';
import type { ScorecardEntry, ScorecardInput } from './models/scorecard-entry';

/** Typed client for Habits Scorecard endpoints. */
@Service()
export class ScorecardApi {
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
