import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateToYYYYMMDD,
  formatDisplayDate,
  formatMonthYear,
  formatRelativeTime,
  toDateValue,
} from "./date";

describe("date utils", () => {
  describe("toDateValue", () => {
    it("converts Date, number timestamp, and valid string to Date object", () => {
      const d = new Date(2026, 7, 15);
      expect(toDateValue(d)).toEqual(d);
      expect(toDateValue(1700000000000)).toBeInstanceOf(Date);
      expect(toDateValue("2026-08-15")).toBeInstanceOf(Date);
    });

    it("returns null for null or invalid inputs", () => {
      expect(toDateValue(null)).toBeNull();
      expect(toDateValue(undefined)).toBeNull();
      expect(toDateValue("invalid")).toBeNull();
    });
  });

  describe("formatDateToYYYYMMDD", () => {
    it("formats Date object into YYYY-MM-DD string", () => {
      const date = new Date(2026, 7, 15); // Month 7 is August (0-indexed)
      expect(formatDateToYYYYMMDD(date)).toBe("2026-08-15");
    });
  });

  describe("formatDisplayDate", () => {
    it("formats YYYY-MM-DD string into readable date label", () => {
      const result = formatDisplayDate("2026-08-15");
      expect(result).toContain("Aug 15, 2026");
    });

    it("handles Date object input", () => {
      const date = new Date(2026, 7, 15);
      const result = formatDisplayDate(date);
      expect(result).toContain("Aug 15, 2026");
    });

    it("returns empty string for empty or invalid input", () => {
      expect(formatDisplayDate("")).toBe("");
      expect(formatDisplayDate(null)).toBe("");
      expect(formatDisplayDate(undefined)).toBe("");
      expect(formatDisplayDate("invalid-date-str")).toBe("");
    });
  });

  describe("formatMonthYear & formatDate", () => {
    it("formats month and year", () => {
      const date = new Date(2026, 7, 1);
      expect(formatMonthYear(date)).toBe("August 2026");
    });

    it("formats locale date", () => {
      const date = new Date(2026, 7, 15);
      expect(formatDate(date)).not.toBe("Unknown");
    });
  });

  describe("formatRelativeTime", () => {
    it("formats relative time or returns fallback", () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe("less than a minute ago");
      expect(formatRelativeTime(null)).toBe("just now");
      expect(formatRelativeTime(null, "custom fallback")).toBe("custom fallback");
    });
  });
});
