function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDate(value?: string | number | Date | null) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateTime(value?: string | number | Date | null) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateRange(start?: string | null, end?: string | null) {
  const startText = formatDate(start);
  const endText = formatDate(end);

  if (startText && endText) {
    return `${startText} 至 ${endText}`;
  }

  return startText || endText || "待安排";
}
