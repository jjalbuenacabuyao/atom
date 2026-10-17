import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Login } from './login';

describe('Login', () => {
  const login = vi.fn();

  beforeEach(() => {
    login.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
    });
  });

  async function setup(returnUrl?: string) {
    const fixture = TestBed.createComponent(Login);
    if (returnUrl) fixture.componentRef.setInput('returnUrl', returnUrl);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const type = (selector: string, value: string) => {
      const input = el.querySelector(selector) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    };
    return { fixture, el, type, submit };
  }

  it('shows validation errors without calling the API', async () => {
    const { el, submit } = await setup();
    await submit();
    expect(el.textContent).toContain('Email is required');
    expect(el.textContent).toContain('Password is required');
    expect(login).not.toHaveBeenCalled();
  });

  it('signs in and follows a safe return URL', async () => {
    login.mockResolvedValue({});
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { type, submit } = await setup('/habits');
    type('input[type=email]', 'james@example.com');
    type('input[autocomplete=current-password]', 'atomic-habits');
    await submit();
    expect(login).toHaveBeenCalledWith({ email: 'james@example.com', password: 'atomic-habits' });
    expect(navigate).toHaveBeenCalledWith('/habits');
  });

  it('ignores external return URLs', async () => {
    login.mockResolvedValue({});
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { type, submit } = await setup('//evil.example.com');
    type('input[type=email]', 'james@example.com');
    type('input[autocomplete=current-password]', 'atomic-habits');
    await submit();
    expect(navigate).toHaveBeenCalledWith('/today');
  });

  it('shows the server error message', async () => {
    login.mockRejectedValue(
      new HttpErrorResponse({
        status: 401,
        error: { error: { code: 'invalid_credentials', message: 'Invalid email or password' } },
      }),
    );
    const { el, type, submit } = await setup();
    type('input[type=email]', 'james@example.com');
    type('input[autocomplete=current-password]', 'wrong-password');
    await submit();
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Invalid email or password');
  });
});
