// Date helpers — all dates stored as YYYY-MM-DD (local time)

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function monthKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function monthKeyFromDate(key: string): string {
  return key.slice(0, 7);
}

// Monday as start of week
export function weekStartKey(d: Date = new Date(), firstDay: 'Sunday' | 'Monday' = 'Monday'): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = firstDay === 'Monday'
    ? day === 0 ? -6 : 1 - day
    : -day;
  date.setDate(date.getDate() + diff);
  return toKey(date);
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function monthDays(month: string): { date: string; inMonth: boolean }[] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const firstDay = first.getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday-first
  const start = new Date(y, m - 1, 1 - startOffset);
  const days: { date: string; inMonth: boolean }[] = [];
  const total = Math.ceil((startOffset + last.getDate()) / 7) * 7;
  for (let i = 0; i < total; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ date: toKey(d), inMonth: d.getMonth() === m - 1 });
  }
  return days;
}

export function formatLongDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatMonthYear(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function shortDayName(key: string): string {
  return fromKey(key).toLocaleDateString('en-US', { weekday: 'short' });
}

export function dayNumber(key: string): number {
  return fromKey(key).getDate();
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${String(hh).padStart(2, '0')}.${String(m).padStart(2, '0')} ${ampm}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}
