import { TestBed } from '@angular/core/testing';
import { Suggestions } from './suggestions';

describe('Suggestions', () => {
  async function setup(items: string[], current = '') {
    const fixture = TestBed.createComponent(Suggestions);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('current', current);
    fixture.componentRef.setInput('label', 'Try a place:');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, buttons: () => Array.from(el.querySelectorAll('button')) };
  }

  it('renders a labelled group of chips', async () => {
    const { el, buttons } = await setup(['the kitchen', 'my desk']);
    expect(el.getAttribute('role')).toBe('group');
    const labelId = el.getAttribute('aria-labelledby')!;
    expect(el.querySelector(`#${labelId}`)?.textContent).toBe('Try a place:');
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(['the kitchen', 'my desk']);
  });

  it('emits the picked value', async () => {
    const { fixture, buttons } = await setup(['the kitchen', 'my desk']);
    const picked: string[] = [];
    fixture.componentInstance.picked.subscribe((v) => picked.push(v));
    buttons()[1].click();
    expect(picked).toEqual(['my desk']);
  });

  it('hides the suggestion that matches the current value', async () => {
    const { buttons } = await setup(['the kitchen', 'my desk'], 'The Kitchen');
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(['my desk']);
  });

  it('hides itself when nothing is left to suggest', async () => {
    const { el } = await setup(['my desk'], 'my desk');
    expect(el.classList).toContain('hidden');
    expect(el.classList).not.toContain('flex');
  });
});
