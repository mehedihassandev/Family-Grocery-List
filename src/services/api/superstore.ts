import { apiClient } from "./config";
import { API_ENDPOINTS } from "./endpoints";
import {
  IItemMarketplaceComparison,
  IBasketOptimizationResult,
  IBasketSplitOptimizationResult,
  IPriceAlert,
  ICreatePriceAlertPayload,
} from "../../types/superstore";

const normalizePriceAlert = (data: any): IPriceAlert => {
  if (!data || typeof data !== "object") return data;
  return {
    ...data,
    id: String(data.id || data.alertId || ""),
    familyId: String(data.familyId || ""),
    query: String(data.query || ""),
    targetPriceBDT: Number(data.targetPriceBDT || 0),
    unit: data.unit ? String(data.unit) : undefined,
    currentBestPriceBDT: data.currentBestPriceBDT != null ? Number(data.currentBestPriceBDT) : undefined,
    currentBestStore: data.currentBestStore || undefined,
    isTriggered: Boolean(data.isTriggered),
    createdAt: String(data.createdAt || new Date().toISOString()),
  };
};

const normalizeBasketSplitResult = (data: any): IBasketSplitOptimizationResult => {
  if (!data || typeof data !== "object") return data;

  const itemAllocations =
    data.itemAllocations ||
    (data.splitStrategy
      ? data.splitStrategy.flatMap((group: any) =>
          (group.items || []).map((item: any) => ({
            itemName: item.productTitle || item.itemName || "",
            bestStoreName: group.storeName || item.storeName || "",
            priceBDT: item.priceBDT || 0,
          })),
        )
      : []);

  const storeBreakdown =
    data.storeBreakdown ||
    (data.splitStrategy
      ? data.splitStrategy.reduce((acc: Record<string, number>, group: any) => {
          acc[group.storeName] = (group.items || []).length;
          return acc;
        }, {})
      : {});

  return {
    familyId: String(data.familyId || ""),
    totalItemsCount: Number(data.totalItemsCount || 0),
    itemAllocations,
    splitTotalBDT: Number(data.splitTotalBDT ?? data.splitStoreTotalBDT ?? 0),
    singleStoreCheapestBDT: Number(data.singleStoreCheapestBDT ?? 0),
    extraSplitSavingsBDT: Number(data.extraSplitSavingsBDT ?? data.additionalSavingsBDT ?? 0),
    storeBreakdown,
  };
};

export const searchSuperstoresApi = async (
  query: string,
  unit?: string,
): Promise<IItemMarketplaceComparison> => {
  if (!query) {
    throw new Error("Search query is required.");
  }
  const response = await apiClient.get<IItemMarketplaceComparison>(
    API_ENDPOINTS.superstores.search,
    {
      params: { q: query, unit },
    },
  );
  return response.data;
};

export const optimizeBasketApi = async (
  familyId: string,
  items: string[],
): Promise<IBasketOptimizationResult> => {
  if (!familyId) {
    throw new Error("Family ID is required.");
  }
  const response = await apiClient.post<IBasketOptimizationResult>(
    API_ENDPOINTS.superstores.basketOptimization,
    { familyId, items },
  );
  return response.data;
};

export const optimizeBasketSplitApi = async (
  familyId: string,
  items: string[],
): Promise<IBasketSplitOptimizationResult> => {
  if (!familyId) {
    throw new Error("Family ID is required.");
  }
  const response = await apiClient.post<unknown>(
    API_ENDPOINTS.superstores.basketSplitOptimization,
    { familyId, items },
  );
  return normalizeBasketSplitResult(response.data);
};

export const createPriceAlertApi = async (
  payload: ICreatePriceAlertPayload,
): Promise<IPriceAlert> => {
  if (!payload.familyId || !payload.query || payload.targetPriceBDT <= 0) {
    throw new Error("Family ID, query, and valid target price are required.");
  }
  const response = await apiClient.post<unknown>(
    API_ENDPOINTS.superstores.priceAlerts,
    payload,
  );
  return normalizePriceAlert(response.data);
};

export const getPriceAlertsApi = async (familyId: string): Promise<IPriceAlert[]> => {
  if (!familyId) {
    throw new Error("Family ID is required.");
  }
  const response = await apiClient.get<unknown[]>(API_ENDPOINTS.superstores.priceAlerts, {
    params: { family_id: familyId },
  });
  if (Array.isArray(response.data)) {
    return response.data.map(normalizePriceAlert);
  }
  return [];
};

export const checkPriceAlertsApi = async (): Promise<IPriceAlert[]> => {
  const response = await apiClient.get<unknown[]>(API_ENDPOINTS.superstores.checkPriceAlerts);
  if (Array.isArray(response.data)) {
    return response.data.map(normalizePriceAlert);
  }
  return [];
};

export const deletePriceAlertApi = async (alertId: string): Promise<void> => {
  if (!alertId) {
    throw new Error("Alert ID is required.");
  }
  await apiClient.delete<void>(API_ENDPOINTS.superstores.priceAlertDetail(alertId));
};
