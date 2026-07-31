import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDailyMealPlan,
  fetchRecipeDetail,
  fetchRecipesList,
  addMissingRecipeIngredientsToCart,
  IDailyMealPlan,
  IRecipeDetail,
} from "../../services/mealPlan";
import { QUERY_KEYS } from "../../constants/query-keys";

export const useDailyMealPlanQuery = (familyId?: string, date?: string) => {
  return useQuery<IDailyMealPlan>({
    queryKey: [QUERY_KEYS.FAMILY, familyId, "meal-plan", date],
    queryFn: () => fetchDailyMealPlan(familyId || "demo-family", date),
    enabled: !!familyId,
  });
};

export const useRecipeDetailQuery = (recipeId: string = "creamy-garlic-pasta") => {
  return useQuery<IRecipeDetail>({
    queryKey: ["recipe-detail", recipeId],
    queryFn: () => fetchRecipeDetail(recipeId),
  });
};

export const useRecipesListQuery = () => {
  return useQuery<IRecipeDetail[]>({
    queryKey: ["recipes-list"],
    queryFn: () => fetchRecipesList(),
  });
};

export const useAddMissingIngredientsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, recipeId }: { familyId: string; recipeId: string }) =>
      addMissingRecipeIngredientsToCart(familyId, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DATA_GROCERY_ITEMS, variables.familyId],
      });
    },
  });
};
