import { IGroceryItem } from "../models/grocery";

export interface IMealConsumptionBreakdown {
  mealType: string;
  itemCount: number;
  totalSpentBDT: number;
  topItems: { name: string; quantity: string; frequency: number }[];
}

export interface ICategorySpendBreakdown {
  category: string;
  totalSpentBDT: number;
  percentage: number;
  color: string;
}

export interface IMonthlyReportSummary {
  monthYearLabel: string;
  totalItemsConsumed: number;
  totalSpentBDT: number;
  budgetBDT: number;
  remainingBudgetBDT: number;
  budgetUtilizationPercentage: number;
  mealBreakdown: IMealConsumptionBreakdown[];
  categoryBreakdown: ICategorySpendBreakdown[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Produce: "#10B981",
  Meat: "#EF4444",
  Fish: "#3B82F6",
  Dairy: "#F59E0B",
  Snacks: "#8B5CF6",
  Drinks: "#06B6D4",
  Household: "#64748B",
  Other: "#6B7280",
};

/**
 * Calculate detailed monthly consumption and meal analytics from grocery list data
 */
export function calculateMonthlyAnalytics(
  items: IGroceryItem[],
  selectedMonth: Date,
  monthlyBudgetBDT = 15000,
): IMonthlyReportSummary {
  const monthYearLabel = selectedMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Filter items matching selected month
  const monthlyItems = items.filter((item) => {
    if (!item.createdAt) return false;
    const itemDate = new Date(item.createdAt);
    return (
      itemDate.getMonth() === selectedMonth.getMonth() &&
      itemDate.getFullYear() === selectedMonth.getFullYear()
    );
  });

  let totalSpentBDT = 0;
  const mealMap: Record<
    string,
    {
      itemCount: number;
      totalSpent: number;
      items: Map<string, { quantity: string; count: number }>;
    }
  > = {
    Breakfast: { itemCount: 0, totalSpent: 0, items: new Map() },
    Lunch: { itemCount: 0, totalSpent: 0, items: new Map() },
    Dinner: { itemCount: 0, totalSpent: 0, items: new Map() },
    Snacks: { itemCount: 0, totalSpent: 0, items: new Map() },
    General: { itemCount: 0, totalSpent: 0, items: new Map() },
  };

  const categoryMap: Record<string, number> = {};

  monthlyItems.forEach((item) => {
    const price = item.estimatedTotal || item.unitPrice || 120;
    totalSpentBDT += price;

    // Category aggregation
    const cat = item.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + price;

    // Meal type aggregation
    const meal = item.mealType || "General";
    if (!mealMap[meal]) {
      mealMap[meal] = { itemCount: 0, totalSpent: 0, items: new Map() };
    }
    mealMap[meal].itemCount += 1;
    mealMap[meal].totalSpent += price;

    const existing = mealMap[meal].items.get(item.name) || {
      quantity: item.quantity || "1",
      count: 0,
    };
    existing.count += 1;
    mealMap[meal].items.set(item.name, existing);
  });

  // Format Meal Breakdown
  const mealBreakdown: IMealConsumptionBreakdown[] = Object.entries(mealMap)
    .filter(([_, data]) => data.itemCount > 0)
    .map(([mealType, data]) => {
      const topItems = Array.from(data.items.entries())
        .map(([name, detail]) => ({
          name,
          quantity: detail.quantity,
          frequency: detail.count,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3);

      return {
        mealType,
        itemCount: data.itemCount,
        totalSpentBDT: data.totalSpent,
        topItems,
      };
    });

  // Format Category Breakdown
  const categoryBreakdown: ICategorySpendBreakdown[] = Object.entries(categoryMap).map(
    ([category, spent]) => ({
      category,
      totalSpentBDT: spent,
      percentage: totalSpentBDT > 0 ? Math.round((spent / totalSpentBDT) * 100) : 0,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other,
    }),
  );

  const remainingBudgetBDT = Math.max(0, monthlyBudgetBDT - totalSpentBDT);
  const budgetUtilizationPercentage =
    monthlyBudgetBDT > 0 ? Math.min(100, Math.round((totalSpentBDT / monthlyBudgetBDT) * 100)) : 0;

  return {
    monthYearLabel,
    totalItemsConsumed: monthlyItems.length,
    totalSpentBDT,
    budgetBDT: monthlyBudgetBDT,
    remainingBudgetBDT,
    budgetUtilizationPercentage,
    mealBreakdown,
    categoryBreakdown,
  };
}
