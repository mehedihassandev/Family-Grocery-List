import { apiClient } from "./config";
import { API_ENDPOINTS } from "./endpoints";
import {
  IItemMarketplaceComparison,
  IBasketOptimizationResult,
  IBasketSplitOptimizationResult,
  IPriceAlert,
  ICreatePriceAlertPayload,
} from "../../types/superstore";

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
  const response = await apiClient.post<IBasketSplitOptimizationResult>(
    API_ENDPOINTS.superstores.basketSplitOptimization,
    { familyId, items },
  );
  return response.data;
};

export const createPriceAlertApi = async (
  payload: ICreatePriceAlertPayload,
): Promise<IPriceAlert> => {
  if (!payload.familyId || !payload.query || payload.targetPriceBDT <= 0) {
    throw new Error("Family ID, query, and valid target price are required.");
  }
  const response = await apiClient.post<IPriceAlert>(
    API_ENDPOINTS.superstores.priceAlerts,
    payload,
  );
  return response.data;
};

export const getPriceAlertsApi = async (familyId: string): Promise<IPriceAlert[]> => {
  if (!familyId) {
    throw new Error("Family ID is required.");
  }
  const response = await apiClient.get<IPriceAlert[]>(API_ENDPOINTS.superstores.priceAlerts, {
    params: { family_id: familyId },
  });
  return response.data;
};

export const checkPriceAlertsApi = async (): Promise<IPriceAlert[]> => {
  const response = await apiClient.get<IPriceAlert[]>(API_ENDPOINTS.superstores.checkPriceAlerts);
  return response.data;
};

export const deletePriceAlertApi = async (alertId: string): Promise<void> => {
  if (!alertId) {
    throw new Error("Alert ID is required.");
  }
  await apiClient.delete<void>(API_ENDPOINTS.superstores.priceAlertDetail(alertId));
};
