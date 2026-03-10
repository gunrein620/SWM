const SEOUL_TIME_ZONE = "Asia/Seoul";

function formatDateParts(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function getDateKey(date: Date) {
  return formatDateParts(date);
}

export function getWeekDates(startDate = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + index);

    const weekdayLabel = new Intl.DateTimeFormat("ko-KR", {
      timeZone: SEOUL_TIME_ZONE,
      weekday: "short"
    }).format(nextDate);

    const dayLabel = new Intl.DateTimeFormat("ko-KR", {
      timeZone: SEOUL_TIME_ZONE,
      month: "numeric",
      day: "numeric"
    }).format(nextDate);

    return {
      value: getDateKey(nextDate),
      weekdayLabel,
      dayLabel
    };
  });
}

export function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
