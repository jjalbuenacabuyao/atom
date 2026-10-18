import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth-guards';

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth-layout').then((m) => m.AuthLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        title: 'Sign in · Atom',
        loadComponent: () => import('./features/auth/login').then((m) => m.Login),
      },
      {
        path: 'register',
        title: 'Create account · Atom',
        loadComponent: () => import('./features/auth/register').then((m) => m.Register),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      {
        path: 'today',
        title: 'Today · Atom',
        loadComponent: () => import('./features/today/today').then((m) => m.Today),
      },
      {
        path: 'habits',
        title: 'Habits · Atom',
        loadComponent: () => import('./features/habits/habit-list').then((m) => m.HabitList),
      },
      {
        path: 'habits/new',
        title: 'New habit · Atom',
        loadComponent: () => import('./features/habits/habit-editor').then((m) => m.HabitEditor),
      },
      {
        path: 'habits/:id',
        title: 'Habit · Atom',
        loadComponent: () => import('./features/habits/habit-detail').then((m) => m.HabitDetail),
      },
      {
        path: 'habits/:id/edit',
        title: 'Edit habit · Atom',
        loadComponent: () => import('./features/habits/habit-editor').then((m) => m.HabitEditor),
      },
      {
        path: 'identity',
        title: 'Identity · Atom',
        loadComponent: () => import('./features/identities/identities').then((m) => m.Identities),
      },
      {
        path: 'scorecard',
        title: 'Scorecard · Atom',
        loadComponent: () => import('./features/scorecard/scorecard').then((m) => m.Scorecard),
      },
      {
        path: 'guide',
        title: 'The Four Laws · Atom',
        loadComponent: () => import('./features/guide/guide').then((m) => m.Guide),
      },
    ],
  },
  { path: '**', redirectTo: 'today' },
];
