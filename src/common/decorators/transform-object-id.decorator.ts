import { Transform } from 'class-transformer';

/**
 * Helper function to convert ObjectId or string to string.
 * @param val - The value to convert.
 * @returns The converted value.
 */
const toHex = (val: any): string | undefined => {
  if (!val) return undefined;
  if (typeof val === 'string') return val;
  return val?.toString?.() as string;
};

/**
 * Decorator to convert ObjectId or string to string.
 * @param field - The field to convert.
 * @returns The converted value.
 */
export function TransformObjectId(field?: string) {
  return Transform(
    ({ value, obj }) => {
      const raw = field ? obj?.[field] : value;
      return toHex(raw);
    },
    { toClassOnly: true },
  );
}
