import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Plus, Flame, Check, RefreshCw, Sun, Sunrise, Moon, Cookie, X } from "lucide-react-native";

import { ROUTES } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import {
  useDailyMealPlanQuery,
  useAddMealPlanItemMutation,
} from "../hooks/queries/useMealPlanQueries";
import { useAppTheme } from "../hooks";
import { AppHeader } from "../components/ui";

const daysOfWeek = [
  { day: "S", date: 12 },
  { day: "M", date: 13 },
  { day: "T", date: 14, isSelected: true },
  { day: "W", date: 15 },
  { day: "T", date: 16 },
  { day: "F", date: 17 },
  { day: "S", date: 18 },
];

/**
 * Meal Planner Screen matching Screenshot 1 mockup with meal creation modal
 */
const MealPlanScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { isDark, colors } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(14);

  const { data: mealPlan } = useDailyMealPlanQuery(user?.familyId || undefined, "2026-10-14");
  const addMealMutation = useAddMealPlanItemMutation();

  // Local state for meal creation modal input
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [newMealCategory, setNewMealCategory] = useState<
    "breakfast" | "lunch" | "dinner" | "snacks"
  >("dinner");

  const handleCreateMeal = async () => {
    if (!newMealName.trim() || !user?.familyId) return;

    try {
      await addMealMutation.mutateAsync({
        familyId: user.familyId,
        mealItem: {
          date: "2026-10-14",
          mealCategory: newMealCategory,
          name: newMealName.trim(),
          prepTimeMins: 15,
          tags: "Custom Plan",
        },
      });
      setNewMealName("");
      setIsAddModalOpen(false);
    } catch (err) {
      console.warn("Failed to create meal item:", err);
    }
  };

  const getCategoryMeals = (category: "breakfast" | "lunch" | "dinner" | "snacks") => {
    return (mealPlan as any)?.[category] || [];
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.bgCanvas : "#F8F9FD" }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <AppHeader
        eyebrow="MEAL PLANNER"
        title="Meal Planner"
        showBackButton
        onBackPress={() => navigation.goBack()}
        onNotificationPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
        onProfilePress={() => navigation.navigate(ROUTES.PROFILE)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        className="flex-1 px-5 pt-3"
      >
        {/* Horizontal Calendar Bar */}
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          className="flex-row items-center justify-between py-2 mb-4"
        >
          {daysOfWeek.map((item, index) => {
            const isSelected = item.date === selectedDate;

            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => setSelectedDate(item.date)}
                className="items-center justify-center py-2 px-2.5 rounded-2xl min-w-[42px]"
                style={{
                  backgroundColor: isSelected ? "#047857" : "transparent",
                }}
              >
                <Text
                  className="text-[11px] font-bold uppercase mb-1"
                  style={{
                    color: isSelected ? "#FFFFFF" : colors.textMuted,
                  }}
                >
                  {item.day}
                </Text>
                <Text
                  className="text-[16px] font-black"
                  style={{
                    color: isSelected ? "#FFFFFF" : colors.textPrimary,
                  }}
                >
                  {item.date}
                </Text>
                {isSelected && <View className="h-1.5 w-1.5 rounded-full bg-white mt-1" />}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Selected Day Header */}
        <Animated.View
          entering={FadeInDown.duration(350).springify()}
          className="flex-row items-center justify-between mb-5"
        >
          <View>
            <Text
              className="text-2xl font-black tracking-tight"
              style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
            >
              Tuesday
            </Text>
            <Text className="text-[12px] font-bold mt-0.5" style={{ color: colors.textMuted }}>
              Oct {selectedDate} •{" "}
              {getCategoryMeals("breakfast").length +
                getCategoryMeals("lunch").length +
                getCategoryMeals("dinner").length +
                getCategoryMeals("snacks").length}{" "}
              Meals Planned
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsAddModalOpen(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-emerald-700 shadow-xs"
          >
            <Plus stroke="white" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>

        {/* AI Suggestions Horizontal Section */}
        <Animated.View entering={FadeInDown.duration(380).springify()} className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center">
              <Flame size={16} stroke={colors.tertiary || "#494BD6"} style={{ marginRight: 6 }} />
              <Text
                className="text-[13px] font-black uppercase tracking-wider"
                style={{ color: colors.textPrimary }}
              >
                AI MEAL SUGGESTIONS
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate(ROUTES.RECIPE_PACKS)}
            >
              <Text
                className="text-[11px] font-extrabold uppercase"
                style={{ color: colors.accent }}
              >
                VIEW ALL
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setNewMealName("Mediterranean Quinoa");
                setNewMealCategory("lunch");
                setIsAddModalOpen(true);
              }}
              className="mr-3 w-64 rounded-2xl overflow-hidden border p-3"
              style={{
                backgroundColor: isDark ? "rgba(18, 37, 62, 0.8)" : "#FFFFFF",
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
              }}
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80",
                }}
                className="h-28 w-full rounded-xl mb-2.5"
                resizeMode="cover"
              />
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className="text-[14px] font-black flex-1 mr-2"
                  style={{ color: colors.textPrimary }}
                  numberOfLines={1}
                >
                  Mediterranean Quinoa
                </Text>
                <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
                  15 min
                </Text>
              </View>
              <Text className="text-[11px] font-medium mb-3" style={{ color: colors.textMuted }}>
                Fiber rich • Healthy bowl
              </Text>
              <View
                className="py-2 rounded-xl items-center justify-center flex-row"
                style={{ backgroundColor: colors.accent }}
              >
                <Plus stroke="#FFFFFF" size={14} strokeWidth={3} style={{ marginRight: 4 }} />
                <Text className="text-white font-black text-[11px] uppercase tracking-wider">
                  ADD TO PLAN
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setNewMealName("Lemon Garlic Salmon");
                setNewMealCategory("dinner");
                setIsAddModalOpen(true);
              }}
              className="mr-3 w-64 rounded-2xl overflow-hidden border p-3"
              style={{
                backgroundColor: isDark ? "rgba(18, 37, 62, 0.8)" : "#FFFFFF",
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
              }}
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=80",
                }}
                className="h-28 w-full rounded-xl mb-2.5"
                resizeMode="cover"
              />
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className="text-[14px] font-black flex-1 mr-2"
                  style={{ color: colors.textPrimary }}
                  numberOfLines={1}
                >
                  Lemon Garlic Salmon
                </Text>
                <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
                  25 min
                </Text>
              </View>
              <Text className="text-[11px] font-medium mb-3" style={{ color: colors.textMuted }}>
                High Protein • Omega 3
              </Text>
              <View
                className="py-2 rounded-xl items-center justify-center flex-row"
                style={{ backgroundColor: colors.accent }}
              >
                <Plus stroke="#FFFFFF" size={14} strokeWidth={3} style={{ marginRight: 4 }} />
                <Text className="text-white font-black text-[11px] uppercase tracking-wider">
                  ADD TO PLAN
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* BREAKFAST Section */}
        <View className="mb-5">
          <View className="flex-row items-center mb-2.5">
            <Sunrise stroke="#0284C7" size={16} style={{ marginRight: 6 }} />
            <Text
              className="text-[11px] font-black uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              BREAKFAST
            </Text>
          </View>

          {getCategoryMeals("breakfast").map((meal: any) => (
            <TouchableOpacity
              key={meal.id}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate(ROUTES.RECIPE_DETAIL, { recipeId: "avocado-toast" })
              }
              className="rounded-2xl p-3.5 flex-row items-center justify-between shadow-2xs mb-2 border"
              style={{
                backgroundColor: isDark ? colors.bgCard : "#FFFFFF",
                borderColor: isDark ? colors.border : "transparent",
              }}
            >
              <View className="flex-row items-center flex-1">
                <Image
                  source={{
                    uri:
                      meal.thumbnailUrl ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80",
                  }}
                  className="h-14 w-14 rounded-2xl mr-3.5"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text
                    className="text-[15px] font-extrabold"
                    style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
                  >
                    {meal.name}
                  </Text>
                  <Text
                    className="text-[11px] font-medium mt-0.5 mb-1.5"
                    style={{ color: colors.textSecondary }}
                  >
                    {meal.prepTimeMins} mins • {meal.tags}
                  </Text>
                  <View className="flex-row items-center">
                    <View
                      className="flex-row items-center px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: isDark ? colors.accentLightSubtle : "#E0E7FF" }}
                    >
                      <Check stroke="#047857" size={10} style={{ marginRight: 3 }} />
                      <Text className="text-[10px] font-black text-emerald-700 uppercase">
                        In Kitchen
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text className="text-slate-300 font-bold text-lg px-2">::</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setNewMealCategory("breakfast");
              setIsAddModalOpen(true);
            }}
            className="rounded-2xl p-5 border-2 border-dashed flex-row items-center justify-center mt-1"
            style={{
              backgroundColor: isDark ? colors.bgSurface : "#F1F4FD",
              borderColor: isDark ? colors.border : "#CBD5E1",
            }}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-sky-100 mr-2.5">
              <Plus stroke="#0284C7" size={18} strokeWidth={2.5} />
            </View>
            <Text className="text-[14px] font-black text-slate-700">Plan Breakfast</Text>
          </TouchableOpacity>
        </View>

        {/* LUNCH Section */}
        <View className="mb-5">
          <View className="flex-row items-center mb-2.5">
            <Sun stroke="#F59E0B" size={16} style={{ marginRight: 6 }} />
            <Text
              className="text-[11px] font-black uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              LUNCH
            </Text>
          </View>

          {getCategoryMeals("lunch").map((meal: any) => (
            <TouchableOpacity
              key={meal.id}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate(ROUTES.RECIPE_DETAIL, { recipeId: "creamy-garlic-pasta" })
              }
              className="rounded-2xl p-3.5 flex-row items-center justify-between shadow-2xs mb-2 border"
              style={{
                backgroundColor: isDark ? colors.bgCard : "#FFFFFF",
                borderColor: isDark ? colors.border : "transparent",
              }}
            >
              <View className="flex-row items-center flex-1">
                <Image
                  source={{
                    uri:
                      meal.thumbnailUrl ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80",
                  }}
                  className="h-14 w-14 rounded-2xl mr-3.5"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text
                    className="text-[15px] font-extrabold"
                    style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
                  >
                    {meal.name}
                  </Text>
                  <Text
                    className="text-[11px] font-medium mt-0.5 mb-1.5"
                    style={{ color: colors.textSecondary }}
                  >
                    {meal.prepTimeMins} mins • {meal.tags}
                  </Text>
                  <View className="flex-row items-center">
                    <View
                      className="flex-row items-center px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: isDark ? colors.bgInput : "#E0E7FF" }}
                    >
                      <RefreshCw stroke="#4338CA" size={10} style={{ marginRight: 3 }} />
                      <Text className="text-[10px] font-black text-indigo-700 uppercase">
                        Syncing
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text className="text-slate-300 font-bold text-lg px-2">::</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setNewMealCategory("lunch");
              setIsAddModalOpen(true);
            }}
            className="rounded-2xl p-5 border-2 border-dashed flex-row items-center justify-center mt-1"
            style={{
              backgroundColor: isDark ? colors.bgSurface : "#F1F4FD",
              borderColor: isDark ? colors.border : "#CBD5E1",
            }}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-amber-100 mr-2.5">
              <Plus stroke="#F59E0B" size={18} strokeWidth={2.5} />
            </View>
            <Text className="text-[14px] font-black text-slate-700">Plan Lunch</Text>
          </TouchableOpacity>
        </View>

        {/* DINNER Section */}
        <View className="mb-5">
          <View className="flex-row items-center mb-2.5">
            <Moon stroke="#4F46E5" size={16} style={{ marginRight: 6 }} />
            <Text
              className="text-[11px] font-black uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              DINNER
            </Text>
          </View>

          {getCategoryMeals("dinner").map((meal: any) => (
            <TouchableOpacity
              key={meal.id}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate(ROUTES.RECIPE_DETAIL, { recipeId: "creamy-garlic-pasta" })
              }
              className="rounded-2xl p-3.5 flex-row items-center justify-between shadow-2xs mb-2 border"
              style={{
                backgroundColor: isDark ? colors.bgCard : "#FFFFFF",
                borderColor: isDark ? colors.border : "transparent",
              }}
            >
              <View className="flex-row items-center flex-1">
                <Image
                  source={{
                    uri:
                      meal.thumbnailUrl ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80",
                  }}
                  className="h-14 w-14 rounded-2xl mr-3.5"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text
                    className="text-[15px] font-extrabold"
                    style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
                  >
                    {meal.name}
                  </Text>
                  <Text
                    className="text-[11px] font-medium mt-0.5 mb-1.5"
                    style={{ color: colors.textSecondary }}
                  >
                    {meal.prepTimeMins} mins • {meal.tags}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setNewMealCategory("dinner");
              setIsAddModalOpen(true);
            }}
            className="rounded-2xl p-5 border-2 border-dashed flex-row items-center justify-center"
            style={{
              backgroundColor: isDark ? colors.bgSurface : "#F1F4FD",
              borderColor: isDark ? colors.border : "#CBD5E1",
            }}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-indigo-100 mr-2.5">
              <Plus stroke="#4F46E5" size={18} strokeWidth={2.5} />
            </View>
            <Text className="text-[14px] font-black text-slate-700">Plan Dinner</Text>
          </TouchableOpacity>
        </View>

        {/* SNACKS Section */}
        <View className="mb-6">
          <View className="flex-row items-center mb-2.5">
            <Cookie stroke="#D97706" size={16} style={{ marginRight: 6 }} />
            <Text
              className="text-[11px] font-black uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              SNACKS
            </Text>
          </View>

          {getCategoryMeals("snacks").map((meal: any) => (
            <TouchableOpacity
              key={meal.id}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate(ROUTES.RECIPE_DETAIL, { recipeId: "creamy-garlic-pasta" })
              }
              className="rounded-2xl p-3.5 flex-row items-center justify-between shadow-2xs mb-2 border"
              style={{
                backgroundColor: isDark ? colors.bgCard : "#FFFFFF",
                borderColor: isDark ? colors.border : "transparent",
              }}
            >
              <View className="flex-row items-center flex-1">
                <Image
                  source={{
                    uri:
                      meal.thumbnailUrl ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80",
                  }}
                  className="h-14 w-14 rounded-2xl mr-3.5"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text
                    className="text-[15px] font-extrabold"
                    style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
                  >
                    {meal.name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setNewMealCategory("snacks");
              setIsAddModalOpen(true);
            }}
            className="rounded-2xl p-5 border-2 border-dashed flex-row items-center justify-center"
            style={{
              backgroundColor: isDark ? colors.bgSurface : "#F1F4FD",
              borderColor: isDark ? colors.border : "#CBD5E1",
            }}
          >
            <Plus stroke="#64748B" size={16} strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text className="text-[14px] font-black text-slate-700">Add Snack</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Meal Creation Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 px-5">
          <View
            className="w-full rounded-2xl p-5 border shadow-xl"
            style={{
              backgroundColor: isDark ? colors.bgCard : "#FFFFFF",
              borderColor: isDark ? colors.border : "#E2E8F0",
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-lg font-black"
                style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
              >
                Plan New Meal
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X stroke="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={newMealName}
              onChangeText={setNewMealName}
              placeholder="e.g. Creamy Garlic Pasta"
              placeholderTextColor="#94A3B8"
              className="w-full h-12 px-4 rounded-2xl border text-[14px] font-semibold mb-4"
              style={{
                backgroundColor: isDark ? colors.bgInput : "#F8FAFC",
                borderColor: isDark ? colors.border : "#E2E8F0",
                color: isDark ? colors.textPrimary : "#0F172A",
              }}
            />

            <View className="flex-row items-center justify-between mb-5 gap-2">
              {(["breakfast", "lunch", "dinner", "snacks"] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setNewMealCategory(cat)}
                  className="flex-1 py-2 rounded-xl items-center border"
                  style={{
                    backgroundColor:
                      newMealCategory === cat ? "#047857" : isDark ? colors.bgInput : "#F1F5F9",
                    borderColor: newMealCategory === cat ? "#047857" : "transparent",
                  }}
                >
                  <Text
                    className="text-[11px] font-black uppercase"
                    style={{ color: newMealCategory === cat ? "#FFFFFF" : colors.textMuted }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleCreateMeal}
              activeOpacity={0.85}
              className="w-full h-12 rounded-2xl bg-emerald-700 items-center justify-center shadow-xs"
            >
              <Text className="text-white font-black text-sm">Save Meal to Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Kcal & Macro Bar */}
      <View
        className="absolute left-5 right-5"
        style={{ bottom: Math.max(insets.bottom + 12, 20) }}
      >
        <Animated.View
          entering={FadeInDown.duration(450).springify()}
          className="rounded-full p-4 flex-row items-center justify-between shadow-lg border"
          style={{
            backgroundColor: isDark ? colors.bgCard : "#FFFFFF",
            borderColor: isDark ? colors.border : "rgba(226, 232, 240, 0.8)",
          }}
        >
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600 mr-3">
              <Flame stroke="white" size={20} fill="white" />
            </View>
            <View>
              <Text
                className="text-[15px] font-black"
                style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
              >
                1,450 / 2,200
              </Text>
              <Text
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: colors.textMuted }}
              >
                KCAL PLANNED
              </Text>
            </View>
          </View>

          {/* Macro Mini Bar Graphs */}
          <View className="flex-row items-center gap-3 pr-2">
            <View className="items-center">
              <View className="h-6 w-1.5 bg-slate-200 rounded-full justify-end overflow-hidden mb-1">
                <View className="w-full bg-teal-600 rounded-full h-[65%]" />
              </View>
              <Text className="text-[8px] font-black text-slate-400">PRO</Text>
            </View>
            <View className="items-center">
              <View className="h-6 w-1.5 bg-slate-200 rounded-full justify-end overflow-hidden mb-1">
                <View className="w-full bg-amber-500 rounded-full h-[80%]" />
              </View>
              <Text className="text-[8px] font-black text-slate-400">CARB</Text>
            </View>
            <View className="items-center">
              <View className="h-6 w-1.5 bg-slate-200 rounded-full justify-end overflow-hidden mb-1">
                <View className="w-full bg-rose-500 rounded-full h-[40%]" />
              </View>
              <Text className="text-[8px] font-black text-slate-400">FAT</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default MealPlanScreen;
