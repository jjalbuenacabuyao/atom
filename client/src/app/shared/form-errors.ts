import type { FieldTree, ValidationError } from '@angular/forms/signals';
import { errorMessage, fieldErrors } from '../core/api';

/**
 * Maps an API error onto a signal form: per-field validation messages are
 * attached to matching fields, anything else becomes a form-level error.
 * Return the result from a `submit()` action.
 */
export function toServerErrors<T>(
  form: FieldTree<T>,
  err: unknown,
): ValidationError.WithOptionalFieldTree[] {
  const fields = form as unknown as Record<string, FieldTree<unknown> | undefined>;
  const errors: ValidationError.WithOptionalFieldTree[] = [];
  for (const [name, message] of Object.entries(fieldErrors(err))) {
    const fieldTree = fields[name];
    if (fieldTree) errors.push({ kind: 'server', message, fieldTree });
  }
  if (errors.length === 0) {
    errors.push({ kind: 'server', message: errorMessage(err), fieldTree: form });
  }
  return errors;
}
