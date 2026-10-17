import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api';
import { today } from './dates';
import type { Dashboard, Habit, HabitInput, HabitLog } from './models';

/** Typed client for habit, check-in and dashboard endpoints. */
@Injectable({ providedIn: 'root' })
export class HabitsService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  /** URL builders, used with `httpResource` for reactive reads. */
  readonly urls = {
    dashboard: (date: string) => ({ url: `${this.base}/dashboard`, params: { today: date } }),
    habits: (archived: boolean) => ({
      url: `${this.base}/habits`,
      params: { today: today(), archived },
    }),
    habit: (id: string) => ({ url: `${this.base}/habits/${id}`, params: { today: today() } }),
    logs: (id: string, from: string, to: string) => ({
      url: `${this.base}/habits/${id}/logs`,
      params: { from, to },
    }),
  };

  /** `days` sets how much activity history to include (server default: 26 weeks). */
  getDashboard(date = today(), days?: number): Observable<Dashboard> {
    const params: Record<string, string | number> = { today: date };
    if (days) params['days'] = days;
    return this.http.get<Dashboard>(`${this.base}/dashboard`, { params });
  }

  create(input: HabitInput): Observable<Habit> {
    return this.http.post<Habit>(`${this.base}/habits`, input, { params: { today: today() } });
  }

  update(id: string, input: HabitInput): Observable<Habit> {
    return this.http.put<Habit>(`${this.base}/habits/${id}`, input, { params: { today: today() } });
  }

  archive(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/habits/${id}/archive`, null);
  }

  restore(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/habits/${id}/restore`, null);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/habits/${id}`);
  }

  reorder(ids: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/habits/order`, { ids });
  }

  check(id: string, date: string, note = ''): Observable<void> {
    return this.http.put<void>(`${this.base}/habits/${id}/logs/${date}`, { note });
  }

  uncheck(id: string, date: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/habits/${id}/logs/${date}`);
  }

  logs(id: string, from: string, to: string): Observable<HabitLog[]> {
    return this.http.get<HabitLog[]>(`${this.base}/habits/${id}/logs`, { params: { from, to } });
  }
}
