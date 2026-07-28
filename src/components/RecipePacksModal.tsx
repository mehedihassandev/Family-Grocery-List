import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from "react-native";
import { Sparkles, X, Check, ShoppingBasket, Wand2 } from "lucide-react-native";

import { useAddGroceryItemBackend, useRecipeToGrocery } from "../hooks";
import { useAuthStore } from "../store/useAuthStore";
import { Category, Priority } from "../types";

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
    id: "taco-night",
    title: "Taco Tuesday",
    description: "Everything you need for a delicious Mexican taco feast.",
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
      { name: "Sour Cream", category: "Dairy", quantity: "8 oz", priority: "Low" },
    ],
  },
  {
    id: "pasta-night",
    title: "Italian Pasta Feast",
    description: "Classic Italian dinner with pasta, sauce, and fresh herbs.",
    icon: "🍝",
    tag: "Quick Dinner",
    color: "#EF4444",
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
    id: "pancake-breakfast",
    title: "Sunday Pancake Breakfast",
    description: "Fluffy pancakes, maple syrup, eggs, bacon, and juice.",
    icon: "🥞",
    tag: "Weekend Brunch",
    color: "#10B981",
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
      {
        name: "Fresh Strawberries & Blueberries",
        category: "Fruits",
        quantity: "2 Tubs",
        priority: "Low",
      },
      { name: "100% Orange Juice", category: "Drinks", quantity: "1 Carton", priority: "Medium" },
    ],
  },
  {
    id: "fitness-prep",
    title: "Healthy Meal Prep",
    description: "Lean proteins, complex carbs, and fresh greens for the week.",
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
      { name: "Plain Greek Yogurt", category: "Dairy", quantity: "32 oz", priority: "Medium" },
    ],
  },
  {
    id: "smoothie-station",
    title: "Smoothie & Energy Station",
    description: "Refreshing fruits, greens, and plant-based boosters.",
    icon: "🍹",
    tag: "Superfood",
    color: "#8B5CF6",
    items: [
      { name: "Frozen Mixed Berries", category: "Fruits", quantity: "1 Bag", priority: "Medium" },
      { name: "Ripe Bananas", category: "Fruits", quantity: "1 Bunch", priority: "Urgent" },
      { name: "Baby Spinach", category: "Vegetables", quantity: "1 Clamshell", priority: "Medium" },
      {
        name: "Unsweetened Almond Milk",
        category: "Drinks",
        quantity: "1 Carton",
        priority: "Medium",
      },
      { name: "Organic Chia Seeds", category: "Snacks", quantity: "1 Bag", priority: "Low" },
    ],
  },
];

interface IRecipePacksModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Modern Out-of-the-Box Recipe & Meal Pack Generator
 * Why: Allows family members to add entire curated meal bundles to their list in 1-click.
 */
export const RecipePacksModal = ({ visible, onClose }: IRecipePacksModalProps) => {
  const { user } = useAuthStore();
  const familyId = user?.familyId || "";
  const addMutation = useAddGroceryItemBackend(familyId);
  const parseRecipeMutation = useRecipeToGrocery();

  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedPack, setSelectedPack] = useState<IRecipePack>(RECIPE_PACKS[0]);
  const [selectedItemNames, setSelectedItemNames] = useState<string[]>(
    RECIPE_PACKS[0].items.map((i) => i.name),
  );
  const [adding, setAdding] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleAiRecipeConvert = () => {
    if (!aiPrompt.trim()) return;

    parseRecipeMutation.mutate(aiPrompt.trim(), {
      onSuccess: (data) => {
        const customPack: IRecipePack = {
          id: `ai-${Date.now()}`,
          title: data.recipeName || aiPrompt,
          description: `AI-generated ingredients for ${data.servings || 4} servings.`,
          icon: "🤖",
          tag: "AI Generated",
          color: "#8B5CF6",
          items: data.ingredients.map((ing) => ({
            name: ing.name,
            category: (ing.category as Category) || "Other",
            quantity: ing.quantity || "1 unit",
            priority: "Medium" as Priority,
          })),
        };
        setSelectedPack(customPack);
        setSelectedItemNames(customPack.items.map((i) => i.name));
      },
    });
  };

  const handleSelectPack = (pack: IRecipePack) => {
    setSelectedPack(pack);
    setSelectedItemNames(pack.items.map((i) => i.name));
    setSuccessCount(null);
  };

  const toggleItemSelection = (itemName: string) => {
    setSelectedItemNames((prev: string[]) =>
      prev.includes(itemName) ? prev.filter((n: string) => n !== itemName) : [...prev, itemName],
    );
  };

  const handleAddBundleToList = async () => {
    if (!familyId || selectedItemNames.length === 0 || adding) return;

    try {
      setAdding(true);
      const itemsToAdd = selectedPack.items.filter((item: IRecipeItem) =>
        selectedItemNames.includes(item.name),
      );

      for (const item of itemsToAdd) {
        await addMutation.mutateAsync({
          name: item.name,
          category: item.category,
          priority: item.priority,
          quantity: item.quantity,
          notes: `Added via ${selectedPack.title} bundle`,
        });
      }

      setSuccessCount(itemsToAdd.length);
      setTimeout(() => {
        setSuccessCount(null);
        onClose();
      }, 1500);
    } catch (error) {
      if (__DEV__) {
        console.warn("Error adding recipe bundle:", error);
      }
    } finally {
      setAdding(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.backdrop} />

        <View className="max-h-[85%] w-full rounded-t-[32px] bg-background px-6 pb-10 pt-4 shadow-2xl">
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between border-b border-border/60 pb-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 border border-primary-100">
                <Sparkles size={20} stroke="#10B981" />
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-primary-600">
                  Instant Meal Bundles
                </Text>
                <Text className="text-[20px] font-bold tracking-tight text-text-primary">
                  Recipe Packs
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-2xl bg-white border border-border"
            >
              <X size={18} stroke="#475569" />
            </TouchableOpacity>
          </View>

          {/* AI Recipe-to-Grocery REST API Converter Box */}
          <View className="mb-4 bg-purple-50 border border-purple-200 rounded-2xl p-3">
            <View className="flex-row items-center mb-2">
              <Wand2 size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
              <Text className="text-xs font-bold text-purple-900">AI Recipe Converter</Text>
            </View>
            <View className="flex-row items-center bg-white rounded-xl border border-purple-200 px-3 py-1">
              <TextInput
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder="e.g. Beef Tehari for 6 people..."
                placeholderTextColor="#94A3B8"
                className="flex-1 text-xs font-medium text-slate-800 h-9"
              />
              <TouchableOpacity
                onPress={handleAiRecipeConvert}
                disabled={!aiPrompt.trim() || parseRecipeMutation.isPending}
                className={`px-3 py-1.5 rounded-lg ${
                  aiPrompt.trim() ? "bg-purple-600" : "bg-slate-200"
                }`}
              >
                {parseRecipeMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-bold text-[11px]">Convert</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Horizontal Pack Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-5 max-h-[88px]"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {RECIPE_PACKS.map((pack) => {
              const isSelected = selectedPack.id === pack.id;
              return (
                <TouchableOpacity
                  key={pack.id}
                  onPress={() => handleSelectPack(pack)}
                  activeOpacity={0.8}
                  className={`mr-3 p-3.5 rounded-2xl border flex-row items-center min-w-[170px] ${
                    isSelected
                      ? "bg-primary-600 border-primary-600 shadow-sm"
                      : "bg-white border-border"
                  }`}
                >
                  <Text className="text-2xl mr-3">{pack.icon}</Text>
                  <View className="flex-1">
                    <Text
                      className={`text-[14px] font-bold ${
                        isSelected ? "text-white" : "text-text-primary"
                      }`}
                      numberOfLines={1}
                    >
                      {pack.title}
                    </Text>
                    <Text
                      className={`text-[10px] font-semibold mt-0.5 ${
                        isSelected ? "text-primary-100" : "text-text-muted"
                      }`}
                    >
                      {pack.items.length} items
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Pack Details & Item Checkbox List */}
          <View className="rounded-3xl border border-border bg-white p-5 mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">{selectedPack.icon}</Text>
                <Text className="text-[17px] font-bold text-text-primary">
                  {selectedPack.title}
                </Text>
              </View>
              <View className="bg-primary-50 px-3 py-1 rounded-xl border border-primary-100">
                <Text className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">
                  {selectedPack.tag}
                </Text>
              </View>
            </View>
            <Text className="text-[13px] text-text-secondary mb-4 leading-5">
              {selectedPack.description}
            </Text>

            <View className="h-[1px] bg-border/60 mb-4" />

            <ScrollView className="max-h-[220px]" showsVerticalScrollIndicator={false}>
              {selectedPack.items.map((item: IRecipeItem) => {
                const checked = selectedItemNames.includes(item.name);
                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => toggleItemSelection(item.name)}
                    activeOpacity={0.8}
                    className="mb-2.5 flex-row items-center justify-between rounded-2xl border border-border/50 bg-slate-50/60 p-3"
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-lg border mr-3 ${
                          checked ? "bg-primary-500 border-primary-500" : "bg-white border-border"
                        }`}
                      >
                        {checked && <Check size={14} stroke="white" strokeWidth={3} />}
                      </View>
                      <Text
                        className={`text-[14px] font-bold flex-1 ${
                          checked ? "text-text-primary" : "text-text-muted line-through"
                        }`}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>

                    <View className="bg-white px-2.5 py-1 rounded-lg border border-border">
                      <Text className="text-[11px] font-bold text-text-secondary">
                        {item.quantity}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Action Button */}
          {successCount !== null ? (
            <View className="h-[52px] rounded-2xl bg-primary-500 items-center justify-center flex-row">
              <Check size={20} stroke="white" strokeWidth={3} className="mr-2" />
              <Text className="text-[15px] font-bold text-white">
                Added {successCount} items to list!
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleAddBundleToList}
              disabled={adding || selectedItemNames.length === 0}
              activeOpacity={0.8}
              className={`h-[52px] rounded-2xl bg-primary-600 items-center justify-center flex-row shadow-lg shadow-primary-500/25 ${
                selectedItemNames.length === 0 || adding ? "opacity-50" : ""
              }`}
            >
              {adding ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <ShoppingBasket size={18} stroke="white" className="mr-2" />
                  <Text className="text-[15px] font-bold text-white">
                    Add {selectedItemNames.length} Items to Family List
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default RecipePacksModal;
