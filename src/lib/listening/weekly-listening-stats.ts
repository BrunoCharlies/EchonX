/** Client-side weekly listening minutes (Mon–Sun) for Listening map bars. */

const STORAGE_KEY = "echonx:weekly-listening-minutes-v1";

export type WeeklyListeningSnapshot = {
  weekKey: string;
  /** Minutes listened per day, index 0 = Monday … 6 = Sunday */
  minutesByDay: number[];
};

function weekKeyFor(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function dayIndex(date: Date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function emptyWeek(): WeeklyListeningSnapshot {
  return { weekKey: weekKeyFor(new Date()), minutesByDay: [0, 0, 0, 0, 0, 0, 0] };
}

export function loadWeeklyListening(): WeeklyListeningSnapshot {
  if (typeof window === "undefined") return emptyWeek();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWeek();
    const parsed = JSON.parse(raw) as WeeklyListeningSnapshot;
    const currentKey = weekKeyFor(new Date());
    if (parsed.weekKey !== currentKey || !Array.isArray(parsed.minutesByDay) || parsed.minutesByDay.length !== 7) {
      return emptyWeek();
    }
    return {
      weekKey: parsed.weekKey,
      minutesByDay: parsed.minutesByDay.map((m) => (Number.isFinite(m) ? Math.max(0, m) : 0)),
    };
  } catch {
    return emptyWeek();
  }
}

function saveWeeklyListening(data: WeeklyListeningSnapshot) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function recordListeningSeconds(seconds: number) {
  if (seconds <= 0 || typeof window === "undefined") return;
  const data = loadWeeklyListening();
  const idx = dayIndex(new Date());
  data.minutesByDay[idx] += seconds / 60;
  saveWeeklyListening(data);
  window.dispatchEvent(new Event("echonx:listening-stats-updated"));
}

export function formatTotalHours(minutes: number[]) {
  const totalMin = minutes.reduce((a, b) => a + b, 0);
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function barHeightsFromMinutes(minutes: number[], maxPx: number) {
  const max = Math.max(...minutes, 1);
  return minutes.map((min) => Math.round((min / max) * maxPx));
}
