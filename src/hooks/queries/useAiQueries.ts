import { useMutation } from "@tanstack/react-query";
import { parseRecipeWithGemini, IAIRecipeParseResponse } from "../../services/aiServicePlaceholder";

/**
 * TanStack Mutation Hook for converting natural language recipes into grocery items
 */
export function useRecipeToGrocery() {
  return useMutation<IAIRecipeParseResponse, Error, string>({
    mutationFn: (recipePrompt: string) => parseRecipeWithGemini(recipePrompt),
  });
}
