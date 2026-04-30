/**
 * Trims text safely.
 */
export const trimText = (value: string | null | undefined) => (value ?? "").trim();

/**
 * Trims and lowercases text.
 */
export const trimLowercaseText = (value: string | null | undefined) =>
  trimText(value).toLowerCase();

/**
 * Trims and uppercases text.
 */
export const trimUppercaseText = (value: string | null | undefined) =>
  trimText(value).toUpperCase();

/**
 * Normalizes invite code input.
 */
export const normalizeInviteCode = (value: string | null | undefined) =>
  trimText(value).replace(/\s+/g, "").toUpperCase();

/**
 * Returns first uppercase letter from text.
 */
export const getInitial = (value: string | null | undefined, fallback = "?") => {
  const normalized = trimText(value);
  return normalized ? normalized.charAt(0).toUpperCase() : fallback;
};

/**
 * Returns initials from full name.
 */
export const getInitials = (value: string | null | undefined, fallback = "U") => {
  const normalized = trimText(value);
  if (!normalized) return fallback;

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  if (parts.length === 1) return getInitial(parts[0], fallback);

  return `${getInitial(parts[0], fallback)}${getInitial(parts[parts.length - 1], fallback)}`;
};
