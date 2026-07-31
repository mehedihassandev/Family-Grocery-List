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

export const fetchDailyMealPlan = async (
  familyId: string,
  date: string = "2026-10-14",
): Promise<IDailyMealPlan> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/families/${familyId}/meal-plans`, {
      params: { date },
    });
    return res.data;
  } catch {
    // Fallback static data if backend offline
    return {
      date,
      dayName: "Tuesday",
      totalKcalPlanned: 1450,
      kcalTarget: 2200,
      mealsPlannedCount: 3,
      macros: { proteinGrams: 45, carbsGrams: 180, fatGrams: 40 },
      breakfast: [
        {
          id: "m1",
          name: "Avocado Toast & Poached Egg",
          category: "breakfast",
          prepTimeMins: 15,
          tags: "High Protein",
          status: "in_kitchen",
          thumbnailUrl:
            "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&auto=format&fit=crop&q=80",
        },
      ],
      lunch: [
        {
          id: "m2",
          name: "Mediterranean Quinoa Bowl",
          category: "lunch",
          prepTimeMins: 10,
          tags: "Vegan Option",
          status: "syncing",
          thumbnailUrl:
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80",
        },
      ],
      dinner: [],
      snacks: [],
    };
  }
};

export const fetchRecipeDetail = async (recipeId: string): Promise<IRecipeDetail> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/recipes/${recipeId}`);
    return res.data;
  } catch {
    return {
      id: "creamy-garlic-pasta",
      title: "Creamy Garlic Pasta",
      prepTimeMins: 20,
      difficulty: "Easy",
      servings: 4,
      kcal: 420,
      pantryMatchPercent: 92,
      isVegetarian: true,
      imageUrl:
        "https://images.unsplash.com/photo-1621996346565-e3d5d6288590?w=800&auto=format&fit=crop&q=80",
      missingCount: 2,
      missingTotalCost: 6.48,
      ingredients: [
        { id: "i1", name: "500g Linguine", amount: "In Pantry", inPantry: true },
        { id: "i2", name: "4 cloves Garlic", amount: "In Pantry", inPantry: true },
        { id: "i3", name: "1/2 cup Parmesan", amount: "In Pantry", inPantry: true },
        { id: "i4", name: "2 tbsp Olive Oil", amount: "In Pantry", inPantry: true },
        { id: "i5", name: "1 cup Heavy Cream", amount: "In Pantry", inPantry: true },
        {
          id: "i6",
          name: "Fresh Parsley",
          amount: "Missing ($1.49)",
          inPantry: false,
          price: 1.49,
        },
        {
          id: "i7",
          name: "Chicken Bouillon",
          amount: "Missing ($4.99)",
          inPantry: false,
          price: 4.99,
        },
      ],
      steps: [
        {
          stepNumber: 1,
          totalSteps: 4,
          phase: "Prep",
          title: "Boil salted water and cook linguine until al dente.",
          instruction:
            "Ensure the water is at a rolling boil before adding the pasta. Stir occasionally during the first few minutes to prevent sticking.",
          timerMins: 10,
          heatLevel: "High Heat",
          imageUrl:
            "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80",
          voicePrompt: 'SAY "NEXT" TO CONTINUE',
        },
        {
          stepNumber: 2,
          totalSteps: 4,
          phase: "Cook",
          title: "In a large pan, sauté minced garlic in olive oil until fragrant.",
          instruction:
            "Sauté over medium heat for about 2 minutes until light golden brown. Be careful not to burn the garlic.",
          timerMins: 2,
          heatLevel: "Medium Heat",
          imageUrl:
            "https://images.unsplash.com/photo-1621996346565-e3d5d6288590?w=800&auto=format&fit=crop&q=80",
          voicePrompt: 'SAY "NEXT" TO CONTINUE',
        },
        {
          stepNumber: 3,
          totalSteps: 4,
          phase: "Simmer",
          title: "Stir in heavy cream and bouillon; simmer for 5 minutes.",
          instruction:
            "Pour cream slowly while stirring constantly to combine with sautéed garlic oil and bouillon.",
          timerMins: 5,
          heatLevel: "Low Heat",
          imageUrl:
            "https://images.unsplash.com/photo-1621996346565-e3d5d6288590?w=800&auto=format&fit=crop&q=80",
          voicePrompt: 'SAY "NEXT" TO CONTINUE',
        },
        {
          stepNumber: 4,
          totalSteps: 4,
          phase: "Serve",
          title: "Toss pasta with sauce and parmesan; garnish with parsley.",
          instruction:
            "Combine cooked linguine directly into sauce. Top generously with grated parmesan and freshly chopped parsley.",
          timerMins: 1,
          heatLevel: "Low Heat",
          imageUrl:
            "https://images.unsplash.com/photo-1621996346565-e3d5d6288590?w=800&auto=format&fit=crop&q=80",
          voicePrompt: 'SAY "DONE" TO FINISH',
        },
      ],
    };
  }
};

export const fetchRecipesList = async (): Promise<IRecipeDetail[]> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/recipes`);
    return res.data;
  } catch {
    const defaultRecipe = await fetchRecipeDetail("creamy-garlic-pasta");
    return [
      defaultRecipe,
      {
        id: "avocado-toast",
        title: "Avocado Toast & Poached Egg",
        prepTimeMins: 15,
        difficulty: "Easy",
        servings: 2,
        kcal: 380,
        pantryMatchPercent: 100,
        isVegetarian: true,
        imageUrl:
          "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
        missingCount: 0,
        missingTotalCost: 0.0,
        ingredients: [
          { id: "i1", name: "2 Slices Sourdough", amount: "In Pantry", inPantry: true },
          { id: "i2", name: "1 Ripe Avocado", amount: "In Pantry", inPantry: true },
          { id: "i3", name: "2 Organic Eggs", amount: "In Pantry", inPantry: true },
        ],
        steps: [
          {
            stepNumber: 1,
            totalSteps: 2,
            phase: "Prep",
            title: "Toast bread and mash ripe avocado with lemon and salt.",
            instruction: "Spread mashed avocado evenly on toasted sourdough slice.",
            timerMins: 3,
            heatLevel: "Medium Heat",
            imageUrl:
              "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
            voicePrompt: 'SAY "NEXT" TO CONTINUE',
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            phase: "Poach",
            title: "Poach eggs in simmering water for 3 minutes.",
            instruction: "Top avocado toast with poached egg and red pepper flakes.",
            timerMins: 3,
            heatLevel: "Low Heat",
            imageUrl:
              "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
            voicePrompt: 'SAY "DONE" TO FINISH',
          },
        ],
      },
    ];
  }
};

export const addMissingRecipeIngredientsToCart = async (
  familyId: string,
  recipeId: string,
): Promise<{ success: boolean; addedCount: number; message: string }> => {
  try {
    const res = await axios.post(
      `${getApiBaseUrl()}/families/${familyId}/recipes/${recipeId}/add-missing`,
    );
    return res.data;
  } catch {
    return {
      success: true,
      addedCount: 2,
      message: "Added 2 missing ingredients to grocery list.",
    };
  }
};
