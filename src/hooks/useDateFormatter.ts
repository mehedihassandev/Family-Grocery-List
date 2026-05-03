import { useCallback } from "react";
import { formatDate, formatMonthYear, formatRelativeTime, TDateLike, toDateValue } from "../utils";

/**
 * Shared date formatter hook for UI and service-facing parsing.
 */
export const useDateFormatter = () => {
  const toDate = useCallback((value: TDateLike) => toDateValue(value), []);

  const toRelativeTime = useCallback(
    (value: TDateLike, fallback?: string) => formatRelativeTime(value, fallback),
    [],
  );

  const toMonthYear = useCallback(
    (value: TDateLike, options?: { locale?: string; fallback?: string }) =>
      formatMonthYear(value, options),
    [],
  );

  const toDateLabel = useCallback(
    (value: TDateLike, options?: { locale?: string; fallback?: string }) =>
      formatDate(value, options),
    [],
  );

  return {
    toDate,
    toRelativeTime,
    toMonthYear,
    toDateLabel,
  };
};
