import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api';
import type { Identity, IdentityInput } from './models/identity';

/** Typed client for identity endpoints. */
@Service()
export class IdentitiesApi {
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
