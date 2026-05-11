const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDateValue(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function resolveScheduleDisplayDate(taskStartDate?: string | null, familyUpcomingAt?: string | null) {
  return normalizeDateValue(taskStartDate) || normalizeDateValue(familyUpcomingAt);
}

export function resolveScheduleCountdownTarget(taskStartDate?: string | null, familyUpcomingAt?: string | null) {
  const source = resolveScheduleDisplayDate(taskStartDate, familyUpcomingAt);

  if (!source) {
    return null;
  }

  if (DATE_ONLY_PATTERN.test(source)) {
    return `${source}T08:30:00+08:00`;
  }

  return source;
}
