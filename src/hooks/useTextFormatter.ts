import { useCallback } from "react";
import {
  getInitial,
  getInitials,
  normalizeInviteCode,
  trimLowercaseText,
  trimText,
  trimUppercaseText,
} from "../utils";

/**
 * Shared text normalizer hook for UI input handling and labels.
 */
export const useTextFormatter = () => {
  const toTrimmed = useCallback((value: string | null | undefined) => trimText(value), []);
  const toLowerTrimmed = useCallback(
    (value: string | null | undefined) => trimLowercaseText(value),
    [],
  );
  const toUpperTrimmed = useCallback(
    (value: string | null | undefined) => trimUppercaseText(value),
    [],
  );
  const toInviteCode = useCallback(
    (value: string | null | undefined) => normalizeInviteCode(value),
    [],
  );
  const toInitial = useCallback(
    (value: string | null | undefined, fallback?: string) => getInitial(value, fallback),
    [],
  );
  const toInitials = useCallback(
    (value: string | null | undefined, fallback?: string) => getInitials(value, fallback),
    [],
  );

  return {
    toTrimmed,
    toLowerTrimmed,
    toUpperTrimmed,
    toInviteCode,
    toInitial,
    toInitials,
  };
};
