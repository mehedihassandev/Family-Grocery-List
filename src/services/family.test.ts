import { describe, expect, it } from "vitest";
import { planOwnerExit } from "./familyPlan";
import { IUser } from "../types";

const member = (uid: string, role: IUser["role"] = "member"): IUser => ({
  uid,
  email: `${uid}@example.com`,
  displayName: uid,
  photoURL: "",
  familyId: "fam-1",
  role,
});

describe("planOwnerExit", () => {
  it("deletes family when owner is last member", () => {
    const plan = planOwnerExit("owner", [member("owner", "owner")]);
    expect(plan.shouldDeleteFamily).toBe(true);
    expect(plan.nextOwnerId).toBeNull();
  });

  it("transfers ownership to first remaining member", () => {
    const plan = planOwnerExit("owner", [member("owner", "owner"), member("alice"), member("bob")]);
    expect(plan.shouldDeleteFamily).toBe(false);
    expect(plan.nextOwnerId).toBe("alice");
  });
});
