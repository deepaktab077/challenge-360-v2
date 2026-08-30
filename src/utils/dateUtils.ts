export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayDateStr(): string {
  return formatIsoDate(new Date());
}

export function getMonthKey(dateOrStr: Date | string): string {
  if (typeof dateOrStr === 'string') {
    return dateOrStr.slice(0, 7); // "YYYY-MM"
  }
  const year = dateOrStr.getFullYear();
  const month = String(dateOrStr.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseIsoDate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDayName(dateStr: string): string {
  const date = parseIsoDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function formatMonthName(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function addDays(dateStr: string, days: number): string {
  const d = parseIsoDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatIsoDate(d);
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateStr();
}

/**
 * Returns the Monday (start) and Sunday (end) of the week containing the given date
 */
export function getWeekRange(dateStr: string): { start: string; end: string; days: string[] } {
  const date = parseIsoDate(dateStr);
  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...
  
  // Calculate distance to Monday (if Sunday (0), it's 6 days prior)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    days.push(formatIsoDate(current));
  }

  return {
    start: days[0],
    end: days[6],
    days,
  };
}

export function getDaysInMonth(year: number, monthZeroIndexed: number): string[] {
  const date = new Date(year, monthZeroIndexed, 1);
  const days: string[] = [];
  while (date.getMonth() === monthZeroIndexed) {
    days.push(formatIsoDate(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getPastNDays(n: number = 14): string[] {
  const today = new Date();
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(formatIsoDate(d));
  }
  return days;
}
