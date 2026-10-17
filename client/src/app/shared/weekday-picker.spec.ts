import { TestBed } from '@angular/core/testing';
import { WeekdayPicker } from './weekday-picker';

describe('WeekdayPicker', () => {
  it('toggles days in the bitmask but never clears the last day', async () => {
    const fixture = TestBed.createComponent(WeekdayPicker);
    fixture.componentRef.setInput('value', 0b0000011); // Sun + Mon
    await fixture.whenStable();

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    expect(buttons).toHaveLength(7);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false');

    buttons[0].click(); // turn Sunday off
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe(0b0000010);

    buttons[1].click(); // Monday is the last day: stays on
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe(0b0000010);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });
});
