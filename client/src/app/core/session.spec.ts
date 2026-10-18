import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Session } from './session';
import type { User } from './models/user';

const user: User = { id: '1', name: 'James Clear', email: 'james@example.com', createdAt: '' };

describe('Session', () => {
  let session: Session;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    session = TestBed.inject(Session);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('restores an existing session', async () => {
    const restoring = session.restoreSession();
    http.expectOne('/api/v1/auth/me').flush(user);
    await restoring;
    expect(session.isAuthenticated()).toBe(true);
    expect(session.firstName()).toBe('James');
  });

  it('treats a 401 on startup as signed out', async () => {
    const restoring = session.restoreSession();
    http.expectOne('/api/v1/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await expect(restoring).resolves.toBeUndefined();
    expect(session.isAuthenticated()).toBe(false);
  });

  it('logs in and out', async () => {
    const login = session.login({ email: user.email, password: 'secret123' });
    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(user);
    await login;
    expect(session.user()).toEqual(user);

    const logout = session.logout();
    http.expectOne('/api/v1/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    await logout;
    expect(session.user()).toBeNull();
  });
});
