const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's date in the server timezone as YYYY-MM-DD. */
export const todayISO = (): string => toISODate(new Date());

export const toISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseISODate = (value: string): number => {
  const [y, m, d] = value.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Whole days from `start` to `end` (end - start). */
export const diffDays = (start: string, end: string): number =>
  Math.round((parseISODate(end) - parseISODate(start)) / DAY_MS);

export const addDays = (value: string, days: number): string => {
  const date = new Date(parseISODate(value) + days * DAY_MS);
  return date.toISOString().slice(0, 10);
};

/** Every date from start to end inclusive. */
export const eachDate = (start: string, end: string): string[] => {
  const days = diffDays(start, end);
  return Array.from({ length: Math.max(0, days + 1) }, (_, i) =>
    addDays(start, i),
  );
};
