import { lowerFirst } from './text';

describe('lowerFirst', () => {
  it('lower-cases ordinary phrases', () => {
    expect(lowerFirst('Pour my coffee')).toBe('pour my coffee');
  });

  it('keeps the pronoun I and acronyms', () => {
    expect(lowerFirst('I brush my teeth')).toBe('I brush my teeth');
    expect(lowerFirst('TV goes off')).toBe('TV goes off');
  });
});
