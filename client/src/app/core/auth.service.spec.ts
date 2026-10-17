import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import type { User } from './models';

const user: User = { id: '1', name: 'James Clear', email: 'james@example.com', createdAt: '' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('restores an existing session', async () => {
    const restoring = service.restoreSession();
    http.expectOne('/api/v1/auth/me').flush(user);
    await restoring;
    expect(service.isAuthenticated()).toBe(true);
    expect(service.firstName()).toBe('James');
  });

  it('treats a 401 on startup as signed out', async () => {
    const restoring = service.restoreSession();
    http.expectOne('/api/v1/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await expect(restoring).resolves.toBeUndefined();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('logs in and out', async () => {
    const login = service.login({ email: user.email, password: 'secret123' });
    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(user);
    await login;
    expect(service.user()).toEqual(user);

    const logout = service.logout();
    http.expectOne('/api/v1/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    await logout;
    expect(service.user()).toBeNull();
  });
});
