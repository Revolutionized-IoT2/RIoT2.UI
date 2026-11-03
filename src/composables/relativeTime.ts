import { onScopeDispose, ref } from 'vue';

const now = ref(Date.now());
let users = 0;
let timer: ReturnType<typeof setInterval> | undefined;

/** The current time, updated every 5 seconds while any component uses it (one timer for all). */
export function useNow() {
  if (users++ === 0)
    timer = setInterval(() => { now.value = Date.now(); }, 5000);
  onScopeDispose(() => {
    if (--users === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  });
  return now;
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1],
];

/** "now", "5 min. ago", "yesterday", in the browser's language; short, for small cards. */
export function relativeTime(time: Date | number, current = Date.now(), locale?: string): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  const seconds = Math.round((new Date(time).getTime() - current) / 1000);
  if (Math.abs(seconds) < 45)
    return format.format(0, 'second');
  const [unit, size] = units.find(([, length]) => Math.abs(seconds) >= length) ?? units[units.length - 1];
  return format.format(Math.round(seconds / size), unit);
}
