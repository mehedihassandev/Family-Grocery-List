import { describe, expect, it } from "vitest";
import { getEmailAuthErrorMessage } from "./authErrors";

describe("getEmailAuthErrorMessage", () => {
  it("maps known firebase code", () => {
    expect(getEmailAuthErrorMessage({ code: "auth/network-request-failed" })).toBe(
      "Network error. Check your connection and try again.",
    );
  });

  it("falls back to generic message for unknown object", () => {
    expect(getEmailAuthErrorMessage({ code: "unknown" })).toBe(
      "Unable to continue with email authentication.",
    );
  });

  it("returns native error message when available", () => {
    expect(getEmailAuthErrorMessage(new Error("boom"))).toBe("boom");
  });
});
