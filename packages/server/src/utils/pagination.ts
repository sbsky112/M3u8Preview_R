/**
 * Clamp pagination parameters to safe bounds.
 * Prevents OOM from unbounded limit values (e.g., ?limit=999999).
 */
export function safePagination(page: number, limit: number, maxLimit: number = 100): { page: number; limit: number } {
  return {
    page: Math.max(1, Math.floor(page) || 1),
    limit: Math.min(Math.max(1, Math.floor(limit) || 20), maxLimit),
  };
}
