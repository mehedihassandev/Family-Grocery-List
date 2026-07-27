import { apiClient } from "./config";
import { API_ENDPOINTS } from "./endpoints";
import {
  ICreateGroceryItemRequest,
  IDataGrocerySummary,
  IGroceryItem,
  IUpdateGroceryItemRequest,
} from "../../models/grocery";

export const getFamilyGrocerySummaryApi = async (
  familyId: string,
): Promise<IDataGrocerySummary> => {
  if (!familyId) {
    throw new Error("Family id is required to load grocery summary.");
  }
  const response = await apiClient.get<IDataGrocerySummary>(
    API_ENDPOINTS.grocery.summary(familyId),
  );
  return response.data;
};

export const getFamilyGroceryItemsApi = async (familyId: string): Promise<IGroceryItem[]> => {
  if (!familyId) {
    throw new Error("Family id is required.");
  }
  const response = await apiClient.get<IGroceryItem[]>(API_ENDPOINTS.grocery.items(familyId));
  return response.data;
};

export const getGroceryItemDetailApi = async (
  familyId: string,
  itemId: string,
): Promise<IGroceryItem> => {
  if (!familyId || !itemId) {
    throw new Error("Family id and item id are required.");
  }

  try {
    const response = await apiClient.get<IGroceryItem>(
      API_ENDPOINTS.grocery.detail(familyId, itemId),
    );
    return response.data;
  } catch (error) {
    const items = await getFamilyGroceryItemsApi(familyId);
    const item = items.find((i) => i.id === itemId);
    if (item) return item;
    throw error;
  }
};

export const addGroceryItemApi = async (
  familyId: string,
  payload: ICreateGroceryItemRequest & Record<string, unknown>,
): Promise<IGroceryItem> => {
  if (!familyId) {
    throw new Error("Family id is required.");
  }
  const response = await apiClient.post<IGroceryItem>(
    API_ENDPOINTS.grocery.items(familyId),
    payload,
  );
  return response.data;
};

export const modifyGroceryItemApi = async (
  familyId: string,
  itemId: string,
  payload: IUpdateGroceryItemRequest & Record<string, unknown>,
): Promise<IGroceryItem> => {
  if (!familyId || !itemId) {
    throw new Error("Family id and item id are required.");
  }
  const response = await apiClient.patch<IGroceryItem>(
    API_ENDPOINTS.grocery.detail(familyId, itemId),
    payload,
  );
  return response.data;
};

export const removeGroceryItemApi = async (familyId: string, itemId: string): Promise<void> => {
  if (!familyId || !itemId) {
    throw new Error("Family id and item id are required.");
  }
  await apiClient.delete<void>(API_ENDPOINTS.grocery.detail(familyId, itemId));
};

export const seedGroceryItemsApi = async (familyId: string): Promise<IGroceryItem[]> => {
  if (!familyId) {
    throw new Error("Family id is required.");
  }
  const response = await apiClient.post<IGroceryItem[]>(API_ENDPOINTS.grocery.seed(familyId));
  return response.data;
};
