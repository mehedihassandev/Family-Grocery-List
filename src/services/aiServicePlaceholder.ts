import { recipeToGroceryApi, getMonthlyInsightsApi } from "./api/ai";

/**
 * AI Service Adapter
 * Calls Python backend REST API, falling back to local stub when server is unreachable.
 */

export interface IAIGeneratedRecipeIngredient {
  name: string;
  category: string;
  quantity: string;
  estimatedPriceBDT?: number;
}

export interface IAIRecipeParseResponse {
  recipeName: string;
  servings: number;
  ingredients: IAIGeneratedRecipeIngredient[];
}

export interface IAIMonthlyInsight {
  headline: string;
  summary: string;
  savingsTips: string[];
}

/**
 * Gemini AI Recipe-to-Grocery converter
 */
export async function parseRecipeWithGemini(recipePrompt: string): Promise<IAIRecipeParseResponse> {
  return await recipeToGroceryApi(recipePrompt);
}

/**
 * Gemini AI Monthly Report Advisor
 */
export async function generateMonthlyInsightWithGemini(
  monthlyDataSummary: string,
  familyId?: string,
): Promise<IAIMonthlyInsight> {
  if (!familyId) {
    throw new Error("familyId is required to generate monthly AI insights.");
  }
  const res = await getMonthlyInsightsApi(familyId, monthlyDataSummary);
  return {
    headline: "Family Grocery Insights",
    summary: res.insights || "No insights available.",
    savingsTips: res.keyRecommendations || [],
  };
}
