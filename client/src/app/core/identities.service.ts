import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api';
import type { Identity, IdentityInput } from './models';

/** Typed client for identity endpoints. */
@Injectable({ providedIn: 'root' })
export class IdentitiesService {
  private readonly http = inject(HttpClient);
  readonly url = `${inject(API_BASE_URL)}/identities`;

  create(input: IdentityInput): Observable<Identity> {
    return this.http.post<Identity>(this.url, input);
  }

  update(id: string, input: IdentityInput): Observable<Identity> {
    return this.http.put<Identity>(`${this.url}/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
