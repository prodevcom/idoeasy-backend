import { Transform } from 'class-transformer';

/**
 * Decorator to convert date to Date object.
 *
 * @param field - The field to convert.
 * @returns The converted value.
 */
export function TransformDate(field?: string) {
  return Transform(
    ({ value, obj }) => {
      const raw = field ? obj?.[field] : value;
      return raw ? new Date(raw) : undefined;
    },
    { toClassOnly: true },
  );
}
