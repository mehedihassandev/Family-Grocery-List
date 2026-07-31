import {
  searchSuperstoresApi,
  optimizeBasketApi,
  optimizeBasketSplitApi,
  createPriceAlertApi,
  getPriceAlertsApi,
  checkPriceAlertsApi,
  deletePriceAlertApi,
} from "./api/superstore";
import {
  IItemMarketplaceComparison,
  IBasketOptimizationResult,
  IBasketSplitOptimizationResult,
  IPriceAlert,
  ICreatePriceAlertPayload,
} from "../types/superstore";
import { IGroceryItem } from "../types";

/**
 * Fetch marketplace price and availability comparison across Shwapno, Meena Bazar, and Agora
 */
export async function fetchSuperstoreComparison(
  itemName: string,
  unit?: string,
): Promise<IItemMarketplaceComparison> {
  return await searchSuperstoresApi(itemName, unit);
}

/**
 * Calculate total basket cost comparison across all 3 superstores for a full grocery list
 */
export async function calculateBasketOptimization(
  items: IGroceryItem[],
  familyId: string,
): Promise<IBasketOptimizationResult> {
  const activeItems = items.filter((i) => i.status === "pending" || !i.status);
  const itemNames = activeItems.map((i) => i.name);
  return await optimizeBasketApi(familyId, itemNames);
}

/**
 * Calculate multi-store split optimization strategy (assigning each item to the cheapest store)
 */
export async function calculateBasketSplitOptimization(
  items: IGroceryItem[],
  familyId: string,
): Promise<IBasketSplitOptimizationResult> {
  const activeItems = items.filter((i) => i.status === "pending" || !i.status);
  const itemNames = activeItems.map((i) => i.name);
  return await optimizeBasketSplitApi(familyId, itemNames);
}

/** Price Alerts API Callers */
export async function createPriceAlert(payload: ICreatePriceAlertPayload): Promise<IPriceAlert> {
  return await createPriceAlertApi(payload);
}

export async function fetchPriceAlerts(familyId: string): Promise<IPriceAlert[]> {
  return await getPriceAlertsApi(familyId);
}

export async function checkPriceAlerts(): Promise<IPriceAlert[]> {
  return await checkPriceAlertsApi();
}

export async function deletePriceAlert(alertId: string): Promise<void> {
  await deletePriceAlertApi(alertId);
}
