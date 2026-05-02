import { describe, expect, it } from "vitest";
import { getInitials, normalizeInviteCode, trimText } from "./text";

describe("text utils", () => {
  it("normalizes invite code by removing spaces and uppercasing", () => {
    expect(normalizeInviteCode(" ab 12 cd ")).toBe("AB12CD");
  });

  it("trims text safely", () => {
    expect(trimText("  hello  ")).toBe("hello");
    expect(trimText(undefined)).toBe("");
  });

  it("builds initials from first and last name", () => {
    expect(getInitials("md mehedi hassan")).toBe("MH");
    expect(getInitials("single")).toBe("S");
  });
});
