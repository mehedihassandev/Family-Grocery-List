import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../constants/query-keys";
import { calculateMonthlyAnalytics } from "../../services/analytics";
import { IGroceryItem } from "../../models/grocery";

/**
 * TanStack Query Hook for calculating monthly item consumption and meal breakdown
 */
export function useMonthlyAnalytics(
  familyId: string | undefined,
  items: IGroceryItem[] = [],
  selectedMonth: Date = new Date(),
  monthlyBudgetBDT = 15000,
) {
  const monthKey = `${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`;

  return useQuery({
    queryKey: [QUERY_KEYS.MONTHLY_ANALYTICS, familyId, monthKey, items.length],
    queryFn: () => calculateMonthlyAnalytics(items, selectedMonth, monthlyBudgetBDT),
    enabled: !!familyId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
