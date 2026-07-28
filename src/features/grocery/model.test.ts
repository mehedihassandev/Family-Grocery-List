import { describe, it, expect } from "vitest";
import { sortLegacyGroceryItemsForHome } from "./model";
import { IGroceryItem } from "../../types";

describe("sortLegacyGroceryItemsForHome", () => {
  it("sorts pending items before completed items", () => {
    const items: IGroceryItem[] = [
      {
        id: "1",
        name: "Milk",
        category: "Dairy",
        priority: "Low",
        status: "completed",
        familyId: "fam1",
        addedBy: { uid: "u1", name: "Alice" },
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "Bread",
        category: "Dairy",
        priority: "Urgent",
        status: "pending",
        familyId: "fam1",
        addedBy: { uid: "u1", name: "Alice" },
        createdAt: "2026-01-02T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
      },
    ];

    const sorted = sortLegacyGroceryItemsForHome(items);
    expect(sorted[0].id).toBe("2");
    expect(sorted[1].id).toBe("1");
  });
});
