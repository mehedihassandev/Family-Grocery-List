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
  try {
    return await recipeToGroceryApi(recipePrompt);
  } catch {
    // AI Fallback stub
    return {
      recipeName: recipePrompt,
      servings: 4,
      ingredients: [
        { name: "Rice (Kataribhog)", category: "Staples", quantity: "1kg", estimatedPriceBDT: 95 },
        { name: "Beef", category: "Meat", quantity: "1kg", estimatedPriceBDT: 780 },
        { name: "Soybean Oil", category: "Staples", quantity: "500ml", estimatedPriceBDT: 90 },
        {
          name: "Onion & Spices",
          category: "Vegetables",
          quantity: "500g",
          estimatedPriceBDT: 120,
        },
      ],
    };
  }
}

/**
 * Gemini AI Monthly Report Advisor
 */
export async function generateMonthlyInsightWithGemini(
  monthlyDataSummary: string,
  familyId?: string,
): Promise<IAIMonthlyInsight> {
  if (familyId) {
    try {
      const res = await getMonthlyInsightsApi(familyId, monthlyDataSummary);
      return {
        headline: "Family Grocery Insights",
        summary: res.insights || "No insight available.",
        savingsTips: res.keyRecommendations || [],
      };
    } catch {
      // ignore and fallback
    }
  }

  // AI Fallback stub
  return {
    headline: "Smart Family Savings Identified",
    summary: "Your spending on snacks increased by 18% this month.",
    savingsTips: [
      "Buying bulk 5L oil at Meena Bazar saves ৳140 vs Shwapno.",
      "Plan weekend meals ahead to reduce extra emergency grocery trips.",
    ],
  };
}
