import { formatDistanceToNow } from "date-fns";

export type TDateLike = Date | number | string | { toDate?: () => Date } | null | undefined;

/**
 * Converts common date-like values (Date, timestamp-like, number, string) to Date.
 */
export const toDateValue = (value: TDateLike): Date | null => {
  if (!value) return null;

  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  if (typeof value === "number" || typeof value === "string") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const parsed = value.toDate();
    return parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : null;
  }

  return null;
};

/**
 * Formats a date-like value into relative text (e.g. "2 hours ago").
 */
export const formatRelativeTime = (value: TDateLike, fallback = "just now") => {
  const parsed = toDateValue(value);
  if (!parsed) return fallback;

  try {
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return fallback;
  }
};

/**
 * Formats a date-like value as month + year label.
 */
export const formatMonthYear = (
  value: TDateLike,
  options?: {
    locale?: string;
    fallback?: string;
  },
) => {
  const locale = options?.locale ?? "en-US";
  const fallback = options?.fallback ?? "";
  const parsed = toDateValue(value);
  if (!parsed) return fallback;

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(parsed);
};

/**
 * Formats a date-like value as locale date string.
 */
export const formatDate = (
  value: TDateLike,
  options?: {
    locale?: string;
    fallback?: string;
  },
) => {
  const locale = options?.locale ?? "en-US";
  const fallback = options?.fallback ?? "Unknown";
  const parsed = toDateValue(value);
  if (!parsed) return fallback;

  const label = parsed.toLocaleDateString(locale);
  return label !== "Invalid Date" ? label : fallback;
};
