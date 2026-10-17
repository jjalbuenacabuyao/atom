/**
 * Lower-cases the first letter so a phrase reads naturally mid-sentence,
 * leaving the pronoun "I" and acronyms ("TV") untouched.
 */
export function lowerFirst(s: string): string {
  if (/^I\b/.test(s) || /^[A-Z]{2}/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}
