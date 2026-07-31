import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDailyMealPlan,
  addMealPlanItemApi,
  fetchRecipeDetail,
  fetchRecipesList,
  fetchRecipePacksApi,
  addMissingRecipeIngredientsToCart,
  IDailyMealPlan,
  IRecipeDetail,
  IRecipePack,
} from "../../services/mealPlan";
import { QUERY_KEYS } from "../../constants/query-keys";

export const useDailyMealPlanQuery = (familyId?: string, date?: string) => {
  return useQuery<IDailyMealPlan>({
    queryKey: [QUERY_KEYS.FAMILY, familyId, "meal-plan", date],
    queryFn: () => fetchDailyMealPlan(familyId!, date),
    enabled: !!familyId,
  });
};

export const useAddMealPlanItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      familyId,
      mealItem,
    }: {
      familyId: string;
      mealItem: {
        date: string;
        mealCategory: "breakfast" | "lunch" | "dinner" | "snacks";
        name: string;
        prepTimeMins?: number;
        tags?: string;
      };
    }) => addMealPlanItemApi(familyId, mealItem),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.FAMILY, variables.familyId, "meal-plan", variables.mealItem.date],
      });
    },
  });
};

export const useRecipeDetailQuery = (recipeId: string) => {
  return useQuery<IRecipeDetail>({
    queryKey: ["recipe-detail", recipeId],
    queryFn: () => fetchRecipeDetail(recipeId),
    enabled: !!recipeId,
  });
};

export const useRecipesListQuery = () => {
  return useQuery<IRecipeDetail[]>({
    queryKey: ["recipes-list"],
    queryFn: () => fetchRecipesList(),
  });
};

export const useRecipePacksQuery = () => {
  return useQuery<IRecipePack[]>({
    queryKey: ["recipe-packs"],
    queryFn: () => fetchRecipePacksApi(),
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
