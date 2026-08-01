import React, { useState, useEffect } from "react";
import { StatusBar, Text, TouchableOpacity, View, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Flame,
  Clock,
  Play,
  Pause,
  Mic,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from "lucide-react-native";

import { ROUTES } from "../types";
import { useRecipeDetailQuery, useRecipesListQuery } from "../hooks/queries/useMealPlanQueries";
import { useAppTheme } from "../hooks";
import { AppHeader } from "../components/ui";

/**
 * AI Cooking Assistant Mode Screen matching Screenshot 2 mockup
 * Workflow:
 * 1. Shows Recipe Catalog list if no recipe is active.
 * 2. Opens step-by-step interactive cooking assistant once recipe is selected.
 */
const CookingModeScreen = ({ navigation, route }: any) => {
  const { isDark, colors } = useAppTheme();

  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(
    route?.params?.recipeId || null,
  );
  const initialStepNumber = route?.params?.stepNumber || 1;

  const { data: recipesList } = useRecipesListQuery();
  const { data: recipe } = useRecipeDetailQuery(activeRecipeId || "");

  const [currentStepIdx, setCurrentStepIdx] = useState(initialStepNumber - 1);
  const [timerSeconds, setTimerSeconds] = useState(600); // 10:00 default
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const steps = recipe?.steps || [];
  const currentStep = steps[currentStepIdx] || null;

  const totalSteps = steps.length;
  const progressPct = totalSteps > 0 ? Math.round(((currentStepIdx + 1) / totalSteps) * 100) : 0;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNextStep = () => {
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
      setIsTimerRunning(false);
      setTimerSeconds(600);
    } else {
      setActiveRecipeId(null);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
      setIsTimerRunning(false);
      setTimerSeconds(600);
    }
  };

  // ── 1. Recipe Selection Catalog Mode (when no recipe is active) ──────────────
  if (!activeRecipeId) {
    return (
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        className="flex-1"
        style={{ backgroundColor: isDark ? colors.bgCanvas : "#F8F9FD" }}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <AppHeader
          eyebrow="AI COOKING ASSISTANT"
          title="Recipe List"
          showBackButton
          onBackPress={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
          onProfilePress={() => navigation.navigate(ROUTES.PROFILE)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          className="flex-1 px-5 pt-3"
        >
          <Animated.View entering={FadeInDown.duration(300).springify()} className="mb-5">
            <Text
              className="text-2xl font-black tracking-tight mb-1"
              style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
            >
              Select Recipe to Cook
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.textSecondary }}>
              Pick a saved or AI-generated recipe to start your step-by-step interactive cooking
              assistant.
            </Text>
          </Animated.View>

          {/* AI Recipe Generator Banner */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate(ROUTES.RECIPE_PACKS)}
            className="rounded-2xl p-4 mb-5 flex-row items-center justify-between border shadow-2xs"
            style={{
              backgroundColor: isDark ? colors.bgSurface : "#EFF6FF",
              borderColor: isDark ? colors.border : "#BFDBFE",
            }}
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 mr-3">
                <Sparkles stroke="white" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-black text-blue-900">
                  Generate Custom AI Recipe
                </Text>
                <Text className="text-[11px] font-medium text-blue-700 mt-0.5">
                  Ask AI chef to create a custom recipe and save to database
                </Text>
              </View>
            </View>
            <ArrowRight stroke="#2563EB" size={18} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Recipes List Catalog */}
          {(recipesList || []).map((r) => (
            <Animated.View
              key={r.id}
              entering={FadeInDown.duration(350).springify()}
              className="rounded-2xl p-4 mb-4 border shadow-xs flex-row items-center justify-between"
              style={{
                backgroundColor: isDark ? colors.bgCard : "#FFFFFF",
                borderColor: isDark ? colors.border : "#F1F5F9",
              }}
            >
              <Image
                source={{
                  uri:
                    r.imageUrl ||
                    "https://images.unsplash.com/photo-1621996346565-e3d5d6288590?w=800&auto=format&fit=crop&q=80",
                }}
                className="h-20 w-20 rounded-2xl mr-3.5"
                resizeMode="cover"
              />

              <View className="flex-1 mr-2">
                <Text
                  className="text-[16px] font-black tracking-tight mb-1"
                  style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
                >
                  {r.title}
                </Text>
                <Text
                  className="text-[12px] font-semibold mb-2"
                  style={{ color: colors.textMuted }}
                >
                  ⏱️ {r.prepTimeMins}m • {r.difficulty} • 🔥 {r.kcal} kcal
                </Text>

                <View className="flex-row items-center gap-1.5 flex-wrap">
                  <View className="px-2.5 py-0.5 rounded-full bg-emerald-100 flex-row items-center">
                    <CheckCircle2 stroke="#047857" size={10} style={{ marginRight: 3 }} />
                    <Text className="text-[10px] font-black text-emerald-800">
                      {r.pantryMatchPercent}% Pantry Match
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setActiveRecipeId(r.id);
                  setCurrentStepIdx(0);
                }}
                className="h-11 px-4 rounded-full bg-emerald-700 flex-row items-center justify-center shadow-xs"
              >
                <Play stroke="white" size={14} fill="white" style={{ marginRight: 4 }} />
                <Text className="text-[12px] font-black text-white">Start</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── 2. Interactive Step-by-Step Cooking Mode ─────────────────────────────
  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      className="flex-1 justify-between"
      style={{ backgroundColor: isDark ? colors.bgCanvas : "#F8F9FD" }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <AppHeader
        eyebrow="AI COOKING MODE"
        title="Cooking Mode"
        showBackButton
        onBackPress={() => setActiveRecipeId(null)}
        onNotificationPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
        onProfilePress={() => navigation.navigate(ROUTES.PROFILE)}
      />

      {/* Step Progress Sub-Header */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[12px] font-extrabold uppercase tracking-wider text-emerald-700">
            STEP {currentStepIdx + 1} OF {totalSteps}
          </Text>
          <Text className="text-[12px] font-bold text-slate-500">{currentStep.phase}</Text>
        </View>

        {/* Green Progress Bar */}
        <View className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden mb-3">
          <View
            className="h-full bg-emerald-600 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        className="flex-1 px-5 pt-1"
      >
        {/* Step Image Hero Card */}
        <Animated.View
          entering={FadeInDown.duration(350).springify()}
          className="relative h-60 w-full rounded-2xl overflow-hidden mb-4 shadow-xs"
        >
          <Image
            source={{
              uri:
                currentStep.imageUrl ||
                "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80",
            }}
            className="h-full w-full object-cover"
            resizeMode="cover"
          />

          {currentStep.heatLevel && (
            <View className="absolute bottom-3 left-3 bg-white/90 px-3 py-1.5 rounded-full flex-row items-center shadow-xs">
              <Flame stroke="#DC2626" size={14} fill="#DC2626" style={{ marginRight: 4 }} />
              <Text className="text-[12px] font-extrabold text-slate-800">
                {currentStep.heatLevel}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Step Instructions Card */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="rounded-2xl p-5 mb-4 shadow-2xs border"
          style={{
            backgroundColor: isDark ? colors.bgSurface : "#EFF3FE",
            borderColor: isDark ? colors.border : "transparent",
          }}
        >
          <Text
            className="text-[20px] font-black tracking-tight leading-snug mb-2"
            style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
          >
            {currentStep.title}
          </Text>

          <Text
            className="text-[13px] font-medium leading-relaxed mb-4"
            style={{ color: isDark ? colors.textSecondary : "#475569" }}
          >
            {currentStep.instruction}
          </Text>

          {/* Countdown Timer Box */}
          <View
            className="rounded-2xl p-4 flex-row items-center justify-between"
            style={{ backgroundColor: isDark ? colors.bgCard : "#FFFFFF" }}
          >
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600 mr-3">
                <Clock stroke="white" size={20} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  className="text-[22px] font-black tracking-widest"
                  style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
                >
                  {formatTimer(timerSeconds)}
                </Text>
                <Text
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: colors.textMuted }}
                >
                  TIMER
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsTimerRunning(!isTimerRunning)}
              className="px-4 py-2.5 rounded-full flex-row items-center"
              style={{ backgroundColor: isTimerRunning ? "#F59E0B" : "#4ADE80" }}
            >
              {isTimerRunning ? (
                <>
                  <Pause stroke="#0F172A" size={14} fill="#0F172A" style={{ marginRight: 4 }} />
                  <Text className="text-[12px] font-black text-slate-900 uppercase">PAUSE</Text>
                </>
              ) : (
                <>
                  <Play stroke="#0F172A" size={14} fill="#0F172A" style={{ marginRight: 4 }} />
                  <Text className="text-[12px] font-black text-slate-900 uppercase">START</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Voice AI Prompt Banner */}
        <Animated.View
          entering={FadeInDown.duration(450).springify()}
          className="rounded-full py-3 px-5 mb-5 flex-row items-center justify-center border"
          style={{
            backgroundColor: isDark ? colors.bgInput : "#F1F4FD",
            borderColor: isDark ? colors.border : "#E0E7FF",
          }}
        >
          <View className="h-7 w-7 items-center justify-center rounded-full bg-indigo-200 mr-2">
            <Mic stroke="#4338CA" size={14} strokeWidth={2.5} />
          </View>
          <Text className="text-[11px] font-black uppercase tracking-wider text-indigo-900">
            {currentStep.voicePrompt || 'SAY "NEXT" TO CONTINUE'}
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom Action Navigation Footer */}
      <View
        className="px-5 pt-3 pb-4 flex-row items-center gap-3 border-t"
        style={{
          backgroundColor: isDark ? colors.bgCanvas : "#F8F9FD",
          borderColor: isDark ? colors.border : "rgba(226, 232, 240, 0.6)",
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePrevStep}
          disabled={currentStepIdx === 0}
          className="flex-1 h-13 rounded-full flex-row items-center justify-center border shadow-2xs"
          style={{
            backgroundColor:
              currentStepIdx === 0
                ? isDark
                  ? colors.bgInput
                  : "#EEF2FF"
                : isDark
                  ? colors.bgInput
                  : "#EEF2FF",
            borderColor: isDark ? colors.border : "#E0E7FF",
            opacity: currentStepIdx === 0 ? 0.6 : 1,
          }}
        >
          <ArrowLeft
            stroke={currentStepIdx === 0 ? "#94A3B8" : "#4338CA"}
            size={18}
            strokeWidth={2.5}
            style={{ marginRight: 8 }}
          />
          <Text
            className="text-[15px] font-black"
            style={{
              color: currentStepIdx === 0 ? "#94A3B8" : "#4338CA",
            }}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNextStep}
          className="flex-[1.4] h-13 rounded-full flex-row items-center justify-center shadow-md"
          style={{ backgroundColor: "#006837" }}
        >
          <Text className="text-[15px] font-black text-white">
            {currentStepIdx === totalSteps - 1 ? "Finish Cooking" : "Next Step"}
          </Text>
          <ArrowRight stroke="white" size={18} strokeWidth={2.5} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CookingModeScreen;
