export const TIME_ZONE = "America/Chicago";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type WeekDay = {
  key: string;
  weekday: string;
  dayLabel: string;
  isToday: boolean;
  isPast: boolean;
};

export function chicagoDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function chicagoWeekdayIndex(date: Date) {
  return WEEKDAYS.indexOf(
    new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short" }).format(date),
  );
}

function chicagoHour(date: Date) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );
}

// Chicago is UTC-5 (CDT) or UTC-6 (CST); probe both offsets for the one that
// lands on midnight of the requested day.
function chicagoDayStart(dayKey: string) {
  for (const offset of ["-05:00", "-06:00"] as const) {
    const candidate = new Date(`${dayKey}T00:00:00${offset}`);

    if (chicagoDayKey(candidate) === dayKey && chicagoHour(candidate) === 0) {
      return candidate;
    }
  }

  throw new Error(`Could not resolve the start of day for ${dayKey}`);
}

/** The current Chicago week, Sunday through Saturday. */
export function getWeekDays(): WeekDay[] {
  const now = new Date();
  const todayIndex = chicagoWeekdayIndex(now);
  const todayKey = chicagoDayKey(now);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getTime() + (index - todayIndex) * DAY_MS);
    const key = chicagoDayKey(date);

    return {
      key,
      weekday: WEEKDAYS[index],
      dayLabel: new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        month: "short",
        day: "numeric",
      }).format(date),
      isToday: index === todayIndex,
      isPast: key < todayKey,
    };
  });
}

/** Midnight Sunday to midnight the following Sunday, in Chicago time. */
export function getWeekRange() {
  const now = new Date();
  const todayIndex = chicagoWeekdayIndex(now);
  const sundayKey = chicagoDayKey(new Date(now.getTime() - todayIndex * DAY_MS));
  const nextSundayKey = chicagoDayKey(new Date(now.getTime() + (7 - todayIndex) * DAY_MS));

  return {
    timeMin: chicagoDayStart(sundayKey),
    timeMax: chicagoDayStart(nextSundayKey),
  };
}
