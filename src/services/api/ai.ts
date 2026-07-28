import { apiClient } from "./config";
import { API_ENDPOINTS } from "./endpoints";
import { IAIRecipeParseResponse } from "../aiServicePlaceholder";

export interface IBackendMonthlyInsightsResponse {
  familyId?: string | null;
  insights: string;
  keyRecommendations: string[];
  potentialMonthlySavingsBDT?: number | null;
}

export const recipeToGroceryApi = async (
  recipePrompt: string,
  servings: number = 4,
): Promise<IAIRecipeParseResponse> => {
  if (!recipePrompt.trim()) {
    throw new Error("Recipe prompt is required.");
  }
  const response = await apiClient.post<IAIRecipeParseResponse>(API_ENDPOINTS.ai.recipeToGrocery, {
    recipePrompt: recipePrompt.trim(),
    servings,
  });
  return response.data;
};

export const getMonthlyInsightsApi = async (
  familyId: string,
  monthlySummaryData?: string,
): Promise<IBackendMonthlyInsightsResponse> => {
  if (!familyId) {
    throw new Error("Family ID is required.");
  }
  const response = await apiClient.post<IBackendMonthlyInsightsResponse>(
    API_ENDPOINTS.ai.monthlyInsights,
    {
      familyId,
      monthlyBreakdown: monthlySummaryData ? { summary: monthlySummaryData } : {},
    },
  );
  return response.data;
};
