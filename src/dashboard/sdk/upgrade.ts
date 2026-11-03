import type { CardElement } from '@/models/dashboard';
import type { JsonValue } from '@/models/generated/contracts';
import { normalizeIcon } from './icons';

/** "{temperature}" -> "temperature"; anything else -> undefined. */
export function memberOfExpression(value: JsonValue | undefined): string | undefined {
  return typeof value === 'string' && value.length > 2 && value.startsWith('{') && value.endsWith('}') ? value.slice(1, -1) : undefined;
}

/**
 * Moves a legacy "{member}" property (`value: "{temperature}"`) to `member`. Before card kinds, a
 * property named the report member it read in braces; cards now choose it with a member field.
 */
export function upgradeMember(element: CardElement, legacyKey = 'value', key = 'member'): void {
  const member = memberOfExpression(element.properties[legacyKey]);
  if (member != null && element.properties[key] == null) {
    element.properties[key] = member;
    delete element.properties[legacyKey];
  }
}

/** Renames a property, keeping its value. */
export function renameProperty(element: CardElement, from: string, to: string): void {
  if (from in element.properties && !(to in element.properties)) {
    element.properties[to] = element.properties[from];
    delete element.properties[from];
  }
}

export { normalizeIcon };
