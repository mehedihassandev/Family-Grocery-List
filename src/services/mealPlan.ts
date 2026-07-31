import { Category, Priority } from "../types";
import axios from "axios";

export interface IMealItem {
  id: string;
  name: string;
  category: "breakfast" | "lunch" | "dinner" | "snacks";
  prepTimeMins: number;
  tags: string;
  status: "in_kitchen" | "syncing" | "planned";
  thumbnailUrl?: string;
}

export interface IMacros {
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface IDailyMealPlan {
  date: string;
  dayName: string;
  totalKcalPlanned: number;
  kcalTarget: number;
  mealsPlannedCount: number;
  macros: IMacros;
  breakfast: IMealItem[];
  lunch: IMealItem[];
  dinner: IMealItem[];
  snacks: IMealItem[];
}

export interface IRecipeIngredient {
  id: string;
  name: string;
  amount: string;
  inPantry: boolean;
  price?: number;
}

export interface IRecipeStep {
  stepNumber: number;
  totalSteps: number;
  phase: string;
  title: string;
  instruction: string;
  timerMins: number;
  heatLevel?: string;
  imageUrl?: string;
  voicePrompt: string;
}

export interface IRecipeDetail {
  id: string;
  title: string;
  prepTimeMins: number;
  difficulty: string;
  servings: number;
  kcal: number;
  pantryMatchPercent: number;
  isVegetarian: boolean;
  imageUrl: string;
  missingCount: number;
  missingTotalCost: number;
  ingredients: IRecipeIngredient[];
  steps: IRecipeStep[];
}

const getApiBaseUrl = () => {
  return process.env.EXPO_PUBLIC_DATA_API_URL || "http://localhost:8000/api/v1";
};

export interface IRecipePackItem {
  name: string;
  category: Category;
  quantity: string;
  priority: Priority;
}

export interface IRecipePack {
  id: string;
  title: string;
  description: string;
  icon: string;
  tag: string;
  color: string;
  items: IRecipePackItem[];
}

export const fetchDailyMealPlan = async (
  familyId: string,
  date: string = "2026-10-14",
): Promise<IDailyMealPlan> => {
  const res = await axios.get(`${getApiBaseUrl()}/families/${familyId}/meal-plans`, {
    params: { date },
  });
  return res.data;
};

export const addMealPlanItemApi = async (
  familyId: string,
  mealItem: {
    date: string;
    mealCategory: "breakfast" | "lunch" | "dinner" | "snacks";
    name: string;
    prepTimeMins?: number;
    tags?: string;
  },
): Promise<IDailyMealPlan> => {
  const res = await axios.post(`${getApiBaseUrl()}/families/${familyId}/meal-plans/item`, mealItem);
  return res.data;
};

export const fetchRecipeDetail = async (recipeId: string): Promise<IRecipeDetail> => {
  const res = await axios.get(`${getApiBaseUrl()}/recipes/${recipeId}`);
  return res.data;
};

export const fetchRecipesList = async (): Promise<IRecipeDetail[]> => {
  const res = await axios.get(`${getApiBaseUrl()}/recipes`);
  return res.data;
};

export const fetchRecipePacksApi = async (): Promise<IRecipePack[]> => {
  const res = await axios.get(`${getApiBaseUrl()}/recipes/packs`);
  return res.data;
};

export const addMissingRecipeIngredientsToCart = async (
  familyId: string,
  recipeId: string,
): Promise<{ success: boolean; addedCount: number; message: string }> => {
  const res = await axios.post(
    `${getApiBaseUrl()}/families/${familyId}/recipes/${recipeId}/add-missing`,
  );
  return res.data;
};
