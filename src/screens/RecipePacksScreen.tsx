import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Check,
  ShoppingBasket,
  Wand2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react-native";

import { useAddGroceryItemBackend, useRecipeToGrocery, useAppTheme } from "../hooks";
import { useAuthStore } from "../store/useAuthStore";
import { Category, Priority, ROUTES } from "../types";
import { AppHeader } from "../components/ui";

interface IRecipeItem {
  name: string;
  category: Category;
  quantity: string;
  priority: Priority;
}

interface IRecipePack {
  id: string;
  title: string;
  description: string;
  icon: string;
  tag: string;
  color: string;
  items: IRecipeItem[];
}

const RECIPE_PACKS: IRecipePack[] = [
  {
    id: "pasta-night",
    title: "Italian Pasta Feast",
    description: "Classic Italian dinner with pasta, garlic cream sauce, and fresh basil.",
    icon: "🍝",
    tag: "Quick Dinner",
    color: "#047857",
    items: [
      {
        name: "Penne or Spaghetti Pasta",
        category: "Household",
        quantity: "2 Boxes",
        priority: "Medium",
      },
      {
        name: "Marinara Pasta Sauce",
        category: "Household",
        quantity: "2 Jars",
        priority: "Urgent",
      },
      { name: "Grated Parmesan Cheese", category: "Dairy", quantity: "1 Tub", priority: "Medium" },
      {
        name: "Fresh Garlic & Olive Oil",
        category: "Vegetables",
        quantity: "1 Head",
        priority: "Low",
      },
      {
        name: "Fresh Basil & Oregano",
        category: "Vegetables",
        quantity: "1 Bunch",
        priority: "Low",
      },
    ],
  },
  {
    id: "taco-night",
    title: "Taco Tuesday",
    description: "Everything you need for a delicious Mexican taco feast with avocados.",
    icon: "🌮",
    tag: "Family Favorite",
    color: "#F59E0B",
    items: [
      { name: "Ground Beef / Turkey", category: "Meat", quantity: "1 lb", priority: "Urgent" },
      {
        name: "Soft Tortillas & Shells",
        category: "Household",
        quantity: "1 Pack",
        priority: "Medium",
      },
      { name: "Salsa & Pico de Gallo", category: "Snacks", quantity: "1 Jar", priority: "Medium" },
      { name: "Shredded Mexican Cheese", category: "Dairy", quantity: "8 oz", priority: "Medium" },
      { name: "Avocados & Lime", category: "Fruits", quantity: "3 pcs", priority: "Low" },
    ],
  },
  {
    id: "pancake-breakfast",
    title: "Sunday Pancake Breakfast",
    description: "Fluffy pancakes, maple syrup, eggs, bacon, and orange juice.",
    icon: "🥞",
    tag: "Weekend Brunch",
    color: "#4F46E5",
    items: [
      {
        name: "Pancake & Waffle Mix",
        category: "Household",
        quantity: "1 Box",
        priority: "Medium",
      },
      { name: "Pure Maple Syrup", category: "Household", quantity: "1 Bottle", priority: "Medium" },
      { name: "Grade A Large Eggs", category: "Dairy", quantity: "1 Dozen", priority: "Urgent" },
      { name: "Smoked Bacon or Sausage", category: "Meat", quantity: "1 Pack", priority: "Medium" },
      { name: "100% Orange Juice", category: "Drinks", quantity: "1 Carton", priority: "Medium" },
    ],
  },
  {
    id: "fitness-prep",
    title: "Healthy Meal Prep",
    description: "Lean proteins, quinoa, sweet potatoes, and fresh broccoli.",
    icon: "🥗",
    tag: "High Protein",
    color: "#0EA5E9",
    items: [
      { name: "Organic Chicken Breast", category: "Meat", quantity: "3 lbs", priority: "Urgent" },
      {
        name: "Quinoa or Brown Rice",
        category: "Household",
        quantity: "1 Bag",
        priority: "Medium",
      },
      {
        name: "Fresh Broccoli & Asparagus",
        category: "Vegetables",
        quantity: "2 Bunches",
        priority: "Medium",
      },
      { name: "Sweet Potatoes", category: "Vegetables", quantity: "4 pcs", priority: "Low" },
    ],
  },
];

/**
 * AI Recipe Generator & Meal Packs Screen
 * Redesigned to match Meal Planner & Cooking AI visual aesthetics
 */
const RecipePacksScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { isDark, colors } = useAppTheme();

  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedPack, setSelectedPack] = useState<IRecipePack>(RECIPE_PACKS[0]);
  const [selectedItemNames, setSelectedItemNames] = useState<string[]>(
    RECIPE_PACKS[0].items.map((i) => i.name),
  );
  const [adding, setAdding] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const parseRecipeMutation = useRecipeToGrocery();
  const addGroceryMutation = useAddGroceryItemBackend();

  const handleSelectPack = (pack: IRecipePack) => {
    setSelectedPack(pack);
    setSelectedItemNames(pack.items.map((i) => i.name));
    setSuccessCount(null);
  };

  const toggleItemSelection = (name: string) => {
    setSelectedItemNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleAiRecipeConvert = async () => {
    if (!aiPrompt.trim()) return;

    try {
      const result = await parseRecipeMutation.mutateAsync(aiPrompt);
      const rawList = Array.isArray(result) ? result : (result as any)?.items || [];
      const convertedItems: IRecipeItem[] = rawList.map((item: any) => ({
        name: item.name,
        category: (item.category as Category) || "Household",
        quantity: item.quantity || "1",
        priority: (item.priority as Priority) || "Medium",
      }));

      const dynamicPack: IRecipePack = {
        id: `custom-${Date.now()}`,
        title: aiPrompt.trim(),
        description: "AI-generated recipe bundle tailored for your family.",
        icon: "🤖",
        tag: "AI Custom",
        color: "#4F46E5",
        items: convertedItems,
      };

      setSelectedPack(dynamicPack);
      setSelectedItemNames(convertedItems.map((i) => i.name));
      setAiPrompt("");
    } catch (err) {
      console.warn("AI conversion error:", err);
    }
  };

  const handleAddBundleToList = async () => {
    if (!user?.familyId || selectedItemNames.length === 0) return;

    setAdding(true);
    setSuccessCount(null);

    const targetItems = selectedPack.items.filter((item) => selectedItemNames.includes(item.name));

    try {
      for (const item of targetItems) {
        await addGroceryMutation.mutateAsync({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          priority: item.priority,
          notes: `Added from ${selectedPack.title}`,
        });
      }
      setSuccessCount(targetItems.length);
      setTimeout(() => setSuccessCount(null), 3000);
    } catch (error) {
      console.warn("Error adding recipe bundle:", error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.bgCanvas : "#F8F9FD" }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <AppHeader
        eyebrow="AI RECIPE GENERATOR"
        title="Grocery List"
        showBackButton
        onBackPress={() => navigation.goBack()}
        onNotificationPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
        onProfilePress={() => navigation.navigate(ROUTES.PROFILE)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
        className="flex-1 px-5 pt-3"
      >
        {/* Hero AI Prompt Box */}
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          className="rounded-3xl p-5 mb-5 shadow-2xs border"
          style={{
            backgroundColor: isDark ? colors.bgSurface : "#EFF3FE",
            borderColor: isDark ? colors.border : "transparent",
          }}
        >
          <View className="flex-row items-center mb-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-600 mr-2.5">
              <Sparkles stroke="white" size={16} />
            </View>
            <Text
              className="text-[17px] font-black tracking-tight"
              style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
            >
              Ask AI Chef
            </Text>
          </View>

          <Text
            className="text-[12px] font-medium leading-relaxed mb-3.5"
            style={{ color: isDark ? colors.textSecondary : "#475569" }}
          >
            Type any dish or recipe name to instantly generate ingredients, add missing items to
            your cart, and save to your database.
          </Text>

          {/* Input Pill Container */}
          <View className="flex-row items-center mb-2">
            <View
              className="flex-1 flex-row items-center rounded-2xl h-12 px-4 border mr-2"
              style={{
                backgroundColor: isDark ? colors.bgCard : "#FFFFFF",
                borderColor: isDark ? colors.border : "#CBD5E1",
              }}
            >
              <Wand2 stroke="#047857" size={18} style={{ marginRight: 8 }} />
              <TextInput
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder="e.g. Beef Tehari for 4 people..."
                placeholderTextColor="#94A3B8"
                className="flex-1 text-[13px] font-semibold"
                style={{
                  color: isDark ? colors.textPrimary : "#0F172A",
                  paddingVertical: 0,
                  height: "100%",
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleAiRecipeConvert}
              disabled={!aiPrompt.trim() || parseRecipeMutation.isPending}
              activeOpacity={0.85}
              className="h-12 px-4 rounded-2xl bg-emerald-700 items-center justify-center shadow-xs flex-row"
              style={{ opacity: !aiPrompt.trim() ? 0.6 : 1 }}
            >
              {parseRecipeMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text className="text-white font-black text-[13px] mr-1">Convert</Text>
                  <ArrowRight stroke="white" size={14} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Horizontal Recipe Packs Category Selector */}
        <Animated.View entering={FadeInDown.duration(350).springify()} className="mb-5">
          <Text
            className="text-[15px] font-black tracking-tight mb-2.5 px-1"
            style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
          >
            Curated Meal Bundles
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 10 }}
          >
            {RECIPE_PACKS.map((pack) => {
              const isSelected = selectedPack.id === pack.id;

              return (
                <TouchableOpacity
                  key={pack.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelectPack(pack)}
                  className="mr-2 py-2 px-3.5 rounded-2xl flex-row items-center border"
                  style={{
                    backgroundColor: isSelected ? "#047857" : isDark ? colors.bgCard : "#FFFFFF",
                    borderColor: isSelected ? "#047857" : isDark ? colors.border : "#E2E8F0",
                  }}
                >
                  <Text className="text-base mr-1.5">{pack.icon}</Text>
                  <Text
                    className="text-[12px] font-extrabold"
                    style={{
                      color: isSelected ? "#FFFFFF" : isDark ? colors.textPrimary : "#0F172A",
                    }}
                  >
                    {pack.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Selected Recipe Bundle Details Card */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="rounded-3xl p-5 mb-5 shadow-2xs border"
          style={{
            backgroundColor: isDark ? colors.bgCard : "#FFFFFF",
            borderColor: isDark ? colors.border : "#F1F5F9",
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center flex-1 mr-2">
              <Text className="text-2xl mr-2.5">{selectedPack.icon}</Text>
              <Text
                className="text-[18px] font-black tracking-tight"
                style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
              >
                {selectedPack.title}
              </Text>
            </View>

            <View className="px-3 py-1 rounded-full bg-emerald-100">
              <Text className="text-[10px] font-black text-emerald-800 uppercase">
                {selectedPack.tag}
              </Text>
            </View>
          </View>

          <Text
            className="text-[13px] font-medium leading-relaxed mb-4"
            style={{ color: isDark ? colors.textSecondary : "#64748B" }}
          >
            {selectedPack.description}
          </Text>

          {/* Ingredients Checklist */}
          <Text
            className="text-[13px] font-black uppercase tracking-wider mb-2.5"
            style={{ color: colors.textMuted }}
          >
            Included Items ({selectedItemNames.length}/{selectedPack.items.length})
          </Text>

          {selectedPack.items.map((item) => {
            const checked = selectedItemNames.includes(item.name);

            return (
              <TouchableOpacity
                key={item.name}
                activeOpacity={0.8}
                onPress={() => toggleItemSelection(item.name)}
                className="rounded-2xl p-3.5 mb-2 flex-row items-center justify-between border"
                style={{
                  backgroundColor: checked
                    ? isDark
                      ? colors.bgSurface
                      : "#EFF3FE"
                    : isDark
                      ? colors.bgInput
                      : "#F8FAFC",
                  borderColor: isDark ? colors.border : "#F1F5F9",
                }}
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View
                    className="h-7 w-7 items-center justify-center rounded-full mr-3"
                    style={{
                      backgroundColor: checked ? "#047857" : "#E2E8F0",
                    }}
                  >
                    <CheckCircle2
                      stroke={checked ? "white" : "#94A3B8"}
                      size={15}
                      strokeWidth={2.5}
                    />
                  </View>

                  <Text
                    className="text-[14px] font-extrabold"
                    style={{
                      color: checked ? (isDark ? colors.textPrimary : "#0F172A") : colors.textMuted,
                      textDecorationLine: checked ? "none" : "line-through",
                    }}
                  >
                    {item.name}
                  </Text>
                </View>

                <Text className="text-[12px] font-bold" style={{ color: colors.textSecondary }}>
                  {item.quantity}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Clean & Aligned Single Floating Action Bar */}
      <View
        className="absolute left-5 right-5"
        style={{ bottom: Math.max(insets.bottom + 12, 20) }}
      >
        <Animated.View
          entering={FadeInDown.duration(450).springify()}
          className="rounded-full shadow-lg overflow-hidden"
        >
          {successCount !== null ? (
            <View className="h-13 rounded-full bg-emerald-600 items-center justify-center flex-row">
              <Check size={18} stroke="white" strokeWidth={3} style={{ marginRight: 6 }} />
              <Text className="text-[15px] font-black text-white">
                Added {successCount} items to list!
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleAddBundleToList}
              disabled={adding || selectedItemNames.length === 0}
              activeOpacity={0.85}
              className={`h-13 rounded-full bg-emerald-700 items-center justify-center flex-row shadow-md ${
                selectedItemNames.length === 0 || adding ? "opacity-50" : ""
              }`}
            >
              {adding ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <ShoppingBasket size={18} stroke="white" style={{ marginRight: 8 }} />
                  <Text className="text-[15px] font-black text-white">
                    Add {selectedItemNames.length} Items to Family List
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default RecipePacksScreen;
