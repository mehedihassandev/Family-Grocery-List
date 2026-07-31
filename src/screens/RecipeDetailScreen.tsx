import React, { useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Heart,
  Clock,
  Gauge,
  Users,
  Flame,
  ShoppingCart,
  Plus,
  CheckCircle2,
  AlertCircle,
  Play,
  Calendar,
} from "lucide-react-native";

import { ROUTES } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import {
  useRecipeDetailQuery,
  useAddMissingIngredientsMutation,
} from "../hooks/queries/useMealPlanQueries";
import { useAppTheme } from "../hooks";
import { AppHeader, StatusModal, LoadingOverlay } from "../components/ui";

/**
 * Recipe Detail Screen matching Screenshot 3 mockup
 */
const RecipeDetailScreen = ({ navigation, route }: any) => {
  const { user } = useAuthStore();
  const { isDark, colors } = useAppTheme();
  const recipeId = route?.params?.recipeId || "";

  const { data: recipe, isLoading } = useRecipeDetailQuery(recipeId);
  const addMissingMutation = useAddMissingIngredientsMutation();
  const [isFavorited, setIsFavorited] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const handleAddAllMissing = () => {
    if (!user?.familyId) return;

    addMissingMutation.mutate(
      { familyId: user.familyId, recipeId },
      {
        onSuccess: (data) => {
          setStatusModal({
            visible: true,
            title: "Added to Grocery List",
            message: data.message || "Missing ingredients added to your shared cart!",
            type: "success",
          });
        },
        onError: (err) => {
          setStatusModal({
            visible: true,
            title: "Action Failed",
            message: err instanceof Error ? err.message : "Could not add ingredients.",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.bgCanvas : "#F8F9FD" }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LoadingOverlay visible={isLoading || addMissingMutation.isPending} />

      <AppHeader
        eyebrow="RECIPE DETAILS"
        title="Recipe Details"
        showBackButton
        onBackPress={() => navigation.goBack()}
        onNotificationPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
        onProfilePress={() => navigation.navigate(ROUTES.PROFILE)}
      />

      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="flex-1"
      >
        {/* Hero Image Header Container */}
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          className="relative h-72 w-full overflow-hidden"
        >
          <Image
            source={{
              uri:
                recipe?.imageUrl ||
                "https://images.unsplash.com/photo-1621996346565-e3d5d6288590?w=800&auto=format&fit=crop&q=80",
            }}
            className="h-full w-full object-cover"
            resizeMode="cover"
          />

          {/* Favorite Overlay Button */}
          <View className="absolute top-4 right-4 flex-row items-center justify-end">
            <TouchableOpacity
              onPress={() => setIsFavorited(!isFavorited)}
              activeOpacity={0.8}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
            >
              <Heart
                stroke={isFavorited ? "#EF4444" : "#0F172A"}
                fill={isFavorited ? "#EF4444" : "transparent"}
                size={18}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </View>

          {/* Badges & Title Over Image */}
          <View className="absolute bottom-4 left-4 right-4">
            <View className="flex-row items-center gap-2 mb-2 flex-wrap">
              <View className="px-3 py-1 rounded-full bg-emerald-700/90 flex-row items-center">
                <Text className="text-[11px] font-black text-white">
                  🌱 {recipe?.pantryMatchPercent || 92}% Pantry Match
                </Text>
              </View>
              <View className="px-3 py-1 rounded-full bg-black/50">
                <Text className="text-[11px] font-bold text-white">Vegetarian Option</Text>
              </View>
            </View>

            <Text className="text-[26px] font-black text-white tracking-tight drop-shadow-md">
              {recipe?.title || "Creamy Garlic Pasta"}
            </Text>
          </View>
        </Animated.View>

        {/* Content Section */}
        <View className="px-5 pt-4">
          {/* Quick Info Bar (4 Stats) */}
          <Animated.View
            entering={FadeInDown.duration(350).springify()}
            className="rounded-3xl p-4 flex-row items-center justify-between mb-4 shadow-2xs border"
            style={{
              backgroundColor: isDark ? colors.bgSurface : "#EFF3FE",
              borderColor: isDark ? colors.border : "transparent",
            }}
          >
            <View className="items-center flex-1">
              <Clock stroke={colors.accent} size={18} strokeWidth={2.2} className="mb-1" />
              <Text
                className="text-[13px] font-black"
                style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
              >
                {recipe?.prepTimeMins || 20}m
              </Text>
            </View>

            <View className="h-8 w-[1px] bg-slate-300/60" />

            <View className="items-center flex-1">
              <Gauge stroke={colors.accent} size={18} strokeWidth={2.2} className="mb-1" />
              <Text
                className="text-[13px] font-black"
                style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
              >
                {recipe?.difficulty || "Easy"}
              </Text>
            </View>

            <View className="h-8 w-[1px] bg-slate-300/60" />

            <View className="items-center flex-1">
              <Users stroke={colors.accent} size={18} strokeWidth={2.2} className="mb-1" />
              <Text
                className="text-[13px] font-black"
                style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
              >
                {recipe?.servings || 4} Servings
              </Text>
            </View>

            <View className="h-8 w-[1px] bg-slate-300/60" />

            <View className="items-center flex-1">
              <Flame stroke={colors.accent} size={18} strokeWidth={2.2} className="mb-1" />
              <Text
                className="text-[13px] font-black"
                style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
              >
                {recipe?.kcal || 420} kcal
              </Text>
            </View>
          </Animated.View>

          {/* Missing Ingredients Banner Card */}
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            className="rounded-3xl p-4 mb-5 flex-row items-center justify-between shadow-2xs border"
            style={{
              backgroundColor: isDark ? colors.badgeRoseBg : "#FEE2E2",
              borderColor: isDark ? colors.badgeRoseBorder : "#FECDD3",
            }}
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white mr-3">
                <ShoppingCart stroke="#DC2626" size={18} strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-extrabold text-red-900">
                  {recipe?.missingCount || 2} Missing Ingredients
                </Text>
                <Text className="text-[11px] font-medium text-red-700 mt-0.5">
                  Add to cart for ${recipe?.missingTotalCost?.toFixed(2) || "6.48"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAddAllMissing}
              disabled={addMissingMutation.isPending}
              className="px-3.5 py-2.5 rounded-full bg-white flex-row items-center shadow-xs"
            >
              <Plus stroke="#DC2626" size={14} strokeWidth={2.5} style={{ marginRight: 4 }} />
              <Text className="text-[12px] font-black text-red-700">
                {addMissingMutation.isPending ? "Adding..." : "+ Add All"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Ingredients Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text
                className="text-[18px] font-black tracking-tight"
                style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
              >
                Ingredients
              </Text>
              <Text className="text-[12px] font-bold text-slate-400">
                For {recipe?.servings || 4} servings
              </Text>
            </View>

            {recipe?.ingredients.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl p-3.5 mb-2.5 flex-row items-center justify-between border"
                style={{
                  backgroundColor: item.inPantry
                    ? isDark
                      ? colors.bgCard
                      : "#FFFFFF"
                    : isDark
                      ? colors.bgSurface
                      : "#EFF3FE",
                  borderColor: isDark ? colors.border : "#F1F5F9",
                }}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="h-8 w-8 items-center justify-center rounded-full mr-3"
                    style={{
                      backgroundColor: item.inPantry ? "#047857" : "#E2E8F0",
                    }}
                  >
                    {item.inPantry ? (
                      <CheckCircle2 stroke="white" size={16} strokeWidth={2.5} />
                    ) : (
                      <AlertCircle stroke="#64748B" size={16} strokeWidth={2} />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text
                      className="text-[14px] font-extrabold"
                      style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      className="text-[11px] font-bold mt-0.5"
                      style={{
                        color: item.inPantry ? "#047857" : "#DC2626",
                      }}
                    >
                      {item.amount}
                    </Text>
                  </View>
                </View>

                {!item.inPantry && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="h-8 w-8 items-center justify-center rounded-full bg-indigo-100"
                  >
                    <Plus stroke="#4F46E5" size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Instructions Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text
                className="text-[18px] font-black tracking-tight"
                style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
              >
                Instructions
              </Text>

              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate(ROUTES.MEAL_PLAN)}
                  className="px-3 py-1.5 rounded-full bg-blue-600 flex-row items-center"
                >
                  <Calendar stroke="white" size={12} style={{ marginRight: 4 }} />
                  <Text className="text-[11px] font-black text-white uppercase">+ Meal Plan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate(ROUTES.COOKING_MODE, { recipeId, stepNumber: 1 })
                  }
                  className="px-3.5 py-1.5 rounded-full bg-emerald-700 flex-row items-center"
                >
                  <Play stroke="white" size={12} fill="white" style={{ marginRight: 4 }} />
                  <Text className="text-[11px] font-black text-white uppercase">Start Cooking</Text>
                </TouchableOpacity>
              </View>
            </View>

            {recipe?.steps.map((step, idx) => (
              <TouchableOpacity
                key={step.stepNumber}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate(ROUTES.COOKING_MODE, {
                    recipeId,
                    stepNumber: step.stepNumber,
                  })
                }
                className="flex-row items-start mb-3"
              >
                {/* Step Circle & Connector Line */}
                <View className="items-center mr-3.5 relative">
                  <View
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: idx === 0 ? "#047857" : isDark ? colors.bgInput : "#E0E7FF",
                    }}
                  >
                    <Text
                      className="text-[13px] font-black"
                      style={{ color: idx === 0 ? "#FFFFFF" : "#4338CA" }}
                    >
                      {step.stepNumber}
                    </Text>
                  </View>
                  {idx < recipe.steps.length - 1 && (
                    <View className="w-[2px] h-12 bg-indigo-200 mt-1" />
                  )}
                </View>

                {/* Step Box */}
                <View
                  className="flex-1 p-3.5 rounded-2xl border"
                  style={{
                    backgroundColor: isDark ? colors.bgCard : "#FFFFFF",
                    borderColor: isDark ? colors.border : "#F1F5F9",
                  }}
                >
                  <Text
                    className="text-[13px] font-extrabold leading-tight"
                    style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
                  >
                    {step.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RecipeDetailScreen;
