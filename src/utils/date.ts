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

/**
 * Formats a Date object to YYYY-MM-DD string format.
 */
export const formatDateToYYYYMMDD = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Formats YYYY-MM-DD string or Date into readable string like "Aug 15, 2026".
 */
export const formatDisplayDate = (val?: TDateLike): string => {
  if (!val) return "";
  let dateObj: Date | null = null;
  if (val instanceof Date) {
    dateObj = isNaN(val.getTime()) ? null : val;
  } else if (typeof val === "string" && val.trim() !== "") {
    const parts = val.trim().split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const parsed = new Date(year, month, day);
      dateObj = isNaN(parsed.getTime()) ? null : parsed;
    } else {
      const parsed = new Date(val);
      dateObj = isNaN(parsed.getTime()) ? null : parsed;
    }
  } else {
    dateObj = toDateValue(val);
  }

  if (!dateObj) return "";

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
