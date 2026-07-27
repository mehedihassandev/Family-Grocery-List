import { describe, expect, it } from "vitest";
import {
  getInitial,
  getInitials,
  normalizeInviteCode,
  trimLowercaseText,
  trimText,
  trimUppercaseText,
} from "./text";

describe("text utils", () => {
  describe("trimText", () => {
    it("trims whitespace from text", () => {
      expect(trimText("  hello  ")).toBe("hello");
    });

    it("returns empty string for null or undefined", () => {
      expect(trimText(null)).toBe("");
      expect(trimText(undefined)).toBe("");
    });
  });

  describe("trimLowercaseText", () => {
    it("trims and converts text to lowercase", () => {
      expect(trimLowercaseText("  HELLO World  ")).toBe("hello world");
    });
  });

  describe("trimUppercaseText", () => {
    it("trims and converts text to uppercase", () => {
      expect(trimUppercaseText("  hello world  ")).toBe("HELLO WORLD");
    });
  });

  describe("normalizeInviteCode", () => {
    it("removes all whitespace and converts to uppercase", () => {
      expect(normalizeInviteCode("  abc - 123  ")).toBe("ABC-123");
    });
  });

  describe("getInitial", () => {
    it("returns first letter uppercase", () => {
      expect(getInitial("alice")).toBe("A");
    });

    it("returns fallback for empty string or null", () => {
      expect(getInitial("", "?")).toBe("?");
      expect(getInitial(null, "?")).toBe("?");
    });
  });

  describe("getInitials", () => {
    it("returns initials for full name", () => {
      expect(getInitials("John Doe")).toBe("JD");
      expect(getInitials("John Mid Doe")).toBe("JD");
    });

    it("returns single initial for single name", () => {
      expect(getInitials("Alice")).toBe("A");
    });

    it("returns fallback for empty input", () => {
      expect(getInitials("", "U")).toBe("U");
      expect(getInitials(null, "U")).toBe("U");
    });
  });
});
