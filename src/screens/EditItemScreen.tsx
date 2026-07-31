import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  Mic,
  ScanLine,
  Plus,
  Minus,
  ChevronDown,
  Sparkles,
  Check,
  Trash2,
  Users,
  Apple,
  Fish,
  Egg,
  IceCream,
  Snowflake,
  CupSoda,
  Home,
  Leaf,
  Tag,
} from "lucide-react-native";
import {
  AuthenticatedStackNavigatorScreenProps,
  Priority,
  ROUTES,
  TItemStatus,
  TItemUnit,
} from "../types";
import {
  useGroceryItemBackend,
  useUpdateGroceryItemBackend,
  useDeleteGroceryItemBackend,
  useFamilyMembers,
  useAppTheme,
  useTextFormatter,
} from "../hooks";
import { useAuthStore } from "../store/useAuthStore";
import { LoadingOverlay, StatusModal, ScannerModal, DatePicker } from "../components/ui";
import { addCustomCategory, ICustomCategory, subscribeToCategories } from "../services/categories";
import { GROCERY_CATEGORIES } from "../features/grocery";

const SUGGESTIONS = [
  "Hass Avocados",
  "Almond Milk",
  "Free Range Eggs",
  "Organic Bananas",
  "Whole Wheat Bread",
];

const CATEGORY_ITEMS = [
  { name: "Produce", icon: Apple, bgColor: "#D1FAE5", iconColor: "#006837" },
  { name: "Meat/Seafood", icon: Fish, bgColor: "#E0F2FE", iconColor: "#0284C7" },
  { name: "Dairy/Eggs", icon: Egg, bgColor: "#EBF2FF", iconColor: "#4F46E5" },
  { name: "Snacks", icon: IceCream, bgColor: "#F3E8FF", iconColor: "#7E22CE" },
  { name: "Frozen", icon: Snowflake, bgColor: "#E0F2FE", iconColor: "#0284C7" },
  { name: "Beverages", icon: CupSoda, bgColor: "#EBF2FF", iconColor: "#4F46E5" },
  { name: "Household", icon: Home, bgColor: "#E0F2FE", iconColor: "#0284C7" },
  { name: "Personal", icon: Leaf, bgColor: "#EBF2FF", iconColor: "#4F46E5" },
];

const UNITS: { label: string; value: TItemUnit }[] = [
  { label: "Pieces (pcs)", value: "pcs" },
  { label: "Kilograms (kg)", value: "kg" },
  { label: "Grams (g)", value: "g" },
  { label: "Liters (L)", value: "L" },
  { label: "Packs (pack)", value: "pack" },
  { label: "Pounds (lb)", value: "lb" },
  { label: "Boxes (box)", value: "box" },
  { label: "Bottles (bottle)", value: "bottle" },
];

const PRIORITIES: Priority[] = ["Low", "Medium", "High"];

const STATUS_OPTIONS: { label: string; value: TItemStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "In Cart", value: "in_cart" },
  { label: "Completed", value: "completed" },
];

const RECURRENCE_OPTIONS: { label: string; value: "none" | "weekly" | "monthly" }[] = [
  { label: "One-time", value: "none" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

/**
 * Edit Item Screen redesigned to match exact modern UI layout of AddItemScreen
 */
const EditItemScreen = ({
  route,
  navigation,
}: AuthenticatedStackNavigatorScreenProps<typeof ROUTES.EDIT_ITEM>) => {
  const { itemId } = route.params;
  const { user } = useAuthStore();
  const { isDark, colors } = useAppTheme();
  const { toInitial } = useTextFormatter();
  const familyId = user?.familyId || "";

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Produce");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [itemStatus, setItemStatus] = useState<TItemStatus>("pending");
  const [quantityCount, setQuantityCount] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<TItemUnit>("pcs");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"none" | "weekly" | "monthly">(
    "none",
  );
  const [assigneeName, setAssigneeName] = useState("Sarah");
  const [dueDateInput, setDueDateInput] = useState("");
  const [reminderAtInput, setReminderAtInput] = useState("");
  const [unitPriceInput, setUnitPriceInput] = useState("");
  const [estimatedTotalInput, setEstimatedTotalInput] = useState("");
  const [customCategories, setCustomCategories] = useState<ICustomCategory[]>([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // TanStack Query Hooks for Backend API
  const { data: item, isLoading: initialLoading } = useGroceryItemBackend(familyId, itemId);
  const updateMutation = useUpdateGroceryItemBackend(familyId);
  const deleteMutation = useDeleteGroceryItemBackend(familyId);
  const { data: members = [] } = useFamilyMembers(familyId);

  const assignableMembers = useMemo(() => {
    const filtered = (members || []).filter((m) => m.uid !== user?.uid);
    if (filtered.length > 0) {
      return filtered.map((m) => ({
        id: m.uid,
        name: m.displayName || m.email?.split("@")[0] || "Member",
        photoURL: m.photoURL,
      }));
    }
    return [
      {
        id: "sarah-demo",
        name: "Sarah",
        photoURL:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop",
      },
      {
        id: "david-demo",
        name: "David",
        photoURL:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop",
      },
    ];
  }, [members, user?.uid]);

  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "confirm";
    onConfirm?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setCategory(item.category || "Produce");
      setPriority((item.priority as Priority) || "Medium");
      setItemStatus(item.status || "pending");

      const parsedQty = parseInt(item.quantity || "1", 10);
      setQuantityCount(Number.isNaN(parsedQty) || parsedQty <= 0 ? 1 : parsedQty);
      if (item.unit) {
        setSelectedUnit(item.unit as TItemUnit);
      }

      setNotes(item.notes || "");
      setRecurrenceFrequency(
        item.recurrenceFrequency === "weekly" || item.recurrenceFrequency === "monthly"
          ? item.recurrenceFrequency
          : "none",
      );
      setAssigneeName(item.assignee?.name || "Sarah");

      const rawDueDate: unknown = item.dueDate;
      if (rawDueDate && typeof rawDueDate === "object" && "toDate" in rawDueDate) {
        setDueDateInput((rawDueDate as { toDate: () => Date }).toDate().toISOString().slice(0, 10));
      } else if (rawDueDate instanceof Date) {
        setDueDateInput(rawDueDate.toISOString().slice(0, 10));
      } else if (typeof rawDueDate === "string") {
        setDueDateInput(rawDueDate.slice(0, 10));
      } else {
        setDueDateInput("");
      }

      const rawReminderAt: unknown = item.reminderAt;
      if (rawReminderAt && typeof rawReminderAt === "object" && "toDate" in rawReminderAt) {
        setReminderAtInput(
          (rawReminderAt as { toDate: () => Date }).toDate().toISOString().slice(0, 10),
        );
      } else if (rawReminderAt instanceof Date) {
        setReminderAtInput(rawReminderAt.toISOString().slice(0, 10));
      } else if (typeof rawReminderAt === "string") {
        setReminderAtInput(rawReminderAt.slice(0, 10));
      } else {
        setReminderAtInput("");
      }

      setUnitPriceInput(
        typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice)
          ? String(item.unitPrice)
          : "",
      );
      setEstimatedTotalInput(
        typeof item.estimatedTotal === "number" && Number.isFinite(item.estimatedTotal)
          ? String(item.estimatedTotal)
          : "",
      );
    }
  }, [item]);

  useEffect(() => {
    if (!familyId) return;
    const unsubscribe = subscribeToCategories(familyId, setCustomCategories);
    return () => unsubscribe();
  }, [familyId]);

  const allCategories = useMemo(() => {
    const defaultCatNames = CATEGORY_ITEMS.map((c) => c.name);
    const normalizedCustom = customCategories.map((c) => c.name.trim()).filter(Boolean);

    return [...defaultCatNames, ...GROCERY_CATEGORIES, ...normalizedCustom].filter(
      (catName, index, source) =>
        source.findIndex((val) => val.toLowerCase() === catName.toLowerCase()) === index,
    );
  }, [customCategories]);

  const handleAddCategory = async () => {
    if (!newCatInput.trim() || !familyId) return;
    try {
      await addCustomCategory(familyId, newCatInput.trim());
      setCategory(newCatInput.trim());
      setNewCatInput("");
      setShowAddCat(false);
    } catch (error) {
      setStatusModal({
        visible: true,
        title: "Category Failed",
        message: error instanceof Error ? error.message : "Could not add category. Please retry.",
        type: "error",
      });
    }
  };

  const handleScannedItem = (scanned: {
    name: string;
    category: any;
    quantity: string;
    priority: any;
  }) => {
    if (scanned.name) setName(scanned.name);
    if (scanned.category) setCategory(scanned.category);
    if (scanned.priority) setPriority(scanned.priority);
  };

  const handleSave = () => {
    if (!item || !name.trim()) return;

    const parseDateInput = (value: string) => {
      const normalized = value.trim();
      if (!normalized) return null;
      const parsed = new Date(normalized);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const dueDate = parseDateInput(dueDateInput);
    if (dueDateInput.trim() && !dueDate) {
      setStatusModal({
        visible: true,
        title: "Invalid Due Date",
        message: "Use format YYYY-MM-DD (example: 2026-05-15).",
        type: "error",
      });
      return;
    }

    const reminderAt = parseDateInput(reminderAtInput);
    if (reminderAtInput.trim() && !reminderAt) {
      setStatusModal({
        visible: true,
        title: "Invalid Reminder Date",
        message: "Use format YYYY-MM-DD (example: 2026-05-14).",
        type: "error",
      });
      return;
    }

    const unitPriceValue = unitPriceInput.trim();
    const unitPriceParsed = unitPriceValue ? Number(unitPriceValue) : NaN;
    if (unitPriceValue && (!Number.isFinite(unitPriceParsed) || unitPriceParsed < 0)) {
      setStatusModal({
        visible: true,
        title: "Invalid Unit Price",
        message: "Enter a valid non-negative number.",
        type: "error",
      });
      return;
    }
    const unitPrice = unitPriceValue ? unitPriceParsed : null;

    const estimatedTotalValue = estimatedTotalInput.trim();
    const estimatedTotalParsed = estimatedTotalValue ? Number(estimatedTotalValue) : NaN;
    if (
      estimatedTotalValue &&
      (!Number.isFinite(estimatedTotalParsed) || estimatedTotalParsed < 0)
    ) {
      setStatusModal({
        visible: true,
        title: "Invalid Estimated Total",
        message: "Enter a valid non-negative number.",
        type: "error",
      });
      return;
    }
    const estimatedTotal = estimatedTotalValue ? estimatedTotalParsed : null;

    updateMutation.mutate(
      {
        itemId: item.id,
        payload: {
          name: name.trim(),
          category,
          priority,
          status: itemStatus,
          quantity: `${quantityCount}`,
          unit: selectedUnit,
          notes: notes.trim(),
          recurrenceFrequency,
          assignee:
            assigneeName.trim() && assigneeName !== "Anyone" ? { name: assigneeName.trim() } : null,
          dueDate,
          reminderAt,
          unitPrice,
          estimatedTotal,
        },
      },
      {
        onSuccess: () => {
          setStatusModal({
            visible: true,
            title: "Item Updated",
            message: `"${name}" has been updated successfully.`,
            type: "success",
          });
        },
        onError: (error) => {
          setStatusModal({
            visible: true,
            title: "Update Failed",
            message:
              error instanceof Error ? error.message : "Could not save changes. Please try again.",
            type: "error",
          });
        },
      },
    );
  };

  const handleDelete = () => {
    if (!item) return;
    setStatusModal({
      visible: true,
      title: "Delete Item",
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      type: "confirm",
      onConfirm: () => {
        setStatusModal((prev) => ({ ...prev, visible: false }));
        deleteMutation.mutate(item.id, {
          onSuccess: () => {
            navigation.goBack();
          },
          onError: (error) => {
            setStatusModal({
              visible: true,
              title: "Delete Failed",
              message:
                error instanceof Error ? error.message : "Could not delete item. Please try again.",
              type: "error",
            });
          },
        });
      },
    });
  };

  const activeUnitObj = useMemo(
    () => UNITS.find((u) => u.value === selectedUnit) || UNITS[0],
    [selectedUnit],
  );

  if (!itemId) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
      >
        <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>No item ID provided</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="font-bold" style={{ color: isDark ? "#34D399" : "#006837" }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (initialLoading) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
      />
    );
  }

  if (!item) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
      >
        <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>Item not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="font-bold" style={{ color: isDark ? "#34D399" : "#006837" }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
    >
      <LoadingOverlay visible={updateMutation.isPending || deleteMutation.isPending} />
      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onConfirm={statusModal.onConfirm}
        onClose={() => {
          const isSuccess = statusModal.type === "success";
          setStatusModal((prev) => ({ ...prev, visible: false }));
          if (isSuccess) navigation.goBack();
        }}
      />

      <ScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScannedItem={handleScannedItem}
      />

      {/* Top Header Row */}
      <View className="px-5 py-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          className="h-10 w-10 rounded-full items-center justify-center border shadow-xs"
          style={{
            backgroundColor: isDark ? "#17233D" : "#EEF4FF",
            borderColor: isDark ? "#253347" : "#E2E8F0",
          }}
        >
          <ChevronLeft stroke={isDark ? "#FFFFFF" : "#0F172A"} size={20} strokeWidth={2.5} />
        </TouchableOpacity>

        <Text
          className="text-xl font-black tracking-tight"
          style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
        >
          Edit Item
        </Text>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handleDelete}
            activeOpacity={0.75}
            className="h-10 w-10 rounded-full items-center justify-center border shadow-xs"
            style={{
              backgroundColor: isDark ? "#3B171A" : "#FEE2E2",
              borderColor: isDark ? "#5C2023" : "#FCA5A5",
            }}
          >
            <Trash2 stroke={isDark ? "#F87171" : "#EF4444"} size={18} strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => (navigation as any).navigate(ROUTES.PROFILE)}
            activeOpacity={0.8}
            className="h-10 w-10 rounded-full items-center justify-center overflow-hidden border shadow-xs"
            style={{ backgroundColor: isDark ? "#10B981" : "#006837", borderColor: "transparent" }}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-white font-black text-sm">
                {toInitial(user?.displayName || "M")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 px-5"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECTION 1: ITEM NAME */}
          <View className="mt-4 mb-6">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-2"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              ITEM NAME
            </Text>

            <View
              className="flex-row items-center rounded-2xl px-4 h-14 border shadow-xs mb-3"
              style={{
                backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#D9E2FC",
              }}
            >
              <Search stroke={isDark ? "#94A3B8" : "#64748B"} size={20} strokeWidth={2.2} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Organic Honey..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                className="ml-3 flex-1 text-[15px] font-bold"
                style={{
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  paddingVertical: 0,
                  height: "100%",
                }}
              />

              <TouchableOpacity
                onPress={() => setIsScannerOpen(true)}
                activeOpacity={0.7}
                className="mr-3"
              >
                <ScanLine stroke={isDark ? "#34D399" : "#006837"} size={20} strokeWidth={2.2} />
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}>
                <Mic stroke={isDark ? "#34D399" : "#006837"} size={20} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Quick Suggestions Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
              {SUGGESTIONS.map((sug) => (
                <TouchableOpacity
                  key={sug}
                  onPress={() => setName(sug)}
                  activeOpacity={0.75}
                  className="mr-2 px-3.5 py-2 rounded-full flex-row items-center border"
                  style={{
                    backgroundColor: isDark ? "#16233B" : "#E0E7FF",
                    borderColor: isDark ? "#253347" : "#C7D2FE",
                  }}
                >
                  <Sparkles size={13} stroke={isDark ? "#34D399" : "#4F46E5"} className="mr-1.5" />
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: isDark ? "#F8FAFC" : "#312E81" }}
                  >
                    {sug}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* SECTION 2: QUANTITY & UNIT */}
          <View className="mb-6">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-2"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              QUANTITY & UNIT
            </Text>

            <View className="flex-row gap-3">
              {/* Stepper Counter Pill */}
              <View
                className="flex-row items-center justify-between rounded-2xl px-3 h-14 border shadow-xs flex-1"
                style={{
                  backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                  borderColor: isDark ? "#253347" : "#D9E2FC",
                }}
              >
                <TouchableOpacity
                  onPress={() => setQuantityCount((prev) => Math.max(1, prev - 1))}
                  activeOpacity={0.75}
                  className="h-9 w-9 rounded-full items-center justify-center bg-white shadow-xs"
                >
                  <Minus stroke="#0F172A" size={16} strokeWidth={2.5} />
                </TouchableOpacity>

                <Text
                  className="text-lg font-black"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                >
                  {quantityCount}
                </Text>

                <TouchableOpacity
                  onPress={() => setQuantityCount((prev) => prev + 1)}
                  activeOpacity={0.75}
                  className="h-9 w-9 rounded-full items-center justify-center bg-white shadow-xs"
                >
                  <Plus stroke="#0F172A" size={16} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Unit Dropdown Selector Pill */}
              <TouchableOpacity
                onPress={() => setShowUnitPicker((prev) => !prev)}
                activeOpacity={0.8}
                className="flex-row items-center justify-between rounded-2xl px-4 h-14 border shadow-xs flex-[1.4]"
                style={{
                  backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                  borderColor: isDark ? "#253347" : "#D9E2FC",
                }}
              >
                <Text
                  className="text-[14px] font-bold"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                >
                  {activeUnitObj.label}
                </Text>
                <ChevronDown stroke={isDark ? "#94A3B8" : "#64748B"} size={18} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Inline Unit Picker Options */}
            {showUnitPicker && (
              <View
                className="mt-2 p-2 rounded-2xl border shadow-md flex-row flex-wrap gap-1.5"
                style={{
                  backgroundColor: isDark ? "#16233B" : "#FFFFFF",
                  borderColor: isDark ? "#253347" : "#E2E8F0",
                }}
              >
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u.value}
                    onPress={() => {
                      setSelectedUnit(u.value);
                      setShowUnitPicker(false);
                    }}
                    activeOpacity={0.8}
                    className="px-3 py-1.5 rounded-xl"
                    style={{
                      backgroundColor:
                        selectedUnit === u.value ? (isDark ? "#064E3B" : "#E0F2FE") : "transparent",
                    }}
                  >
                    <Text
                      className="text-[12px] font-bold"
                      style={{
                        color:
                          selectedUnit === u.value
                            ? isDark
                              ? "#34D399"
                              : "#0284C7"
                            : isDark
                              ? "#94A3B8"
                              : "#475569",
                      }}
                    >
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* SECTION 3: CATEGORY (4x2 Grid & Custom Support) */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className="text-[11px] font-extrabold uppercase tracking-wider"
                style={{ color: isDark ? "#94A3B8" : "#475569" }}
              >
                CATEGORY
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddCat(!showAddCat)}
                activeOpacity={0.75}
                className="px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                  borderColor: isDark ? "#34D399" : "#006837",
                }}
              >
                <Text
                  className="text-[10px] font-extrabold uppercase tracking-wider"
                  style={{ color: isDark ? "#34D399" : "#006837" }}
                >
                  {showAddCat ? "Cancel" : "+ Custom"}
                </Text>
              </TouchableOpacity>
            </View>

            {showAddCat && (
              <View className="mb-4 flex-row gap-2">
                <View
                  className="flex-1 flex-row items-center rounded-2xl px-4 h-12 border shadow-xs"
                  style={{
                    backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                    borderColor: isDark ? "#253347" : "#D9E2FC",
                  }}
                >
                  <TextInput
                    value={newCatInput}
                    onChangeText={setNewCatInput}
                    placeholder="New category name..."
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    className="flex-1 text-[14px] font-bold"
                    style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleAddCategory}
                  activeOpacity={0.8}
                  className="h-12 px-5 rounded-2xl items-center justify-center shadow-xs"
                  style={{ backgroundColor: isDark ? "#34D399" : "#006837" }}
                >
                  <Check stroke={isDark ? "#0B132B" : "#FFFFFF"} size={18} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row flex-wrap justify-between gap-y-3">
              {CATEGORY_ITEMS.map((cat) => {
                const isSelected = category === cat.name;
                const IconComp = cat.icon;

                return (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={() => setCategory(cat.name)}
                    activeOpacity={0.8}
                    className="w-[23%] items-center justify-center py-3 rounded-2xl border shadow-xs"
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? "#1E2A3A"
                          : "#EEF4FF"
                        : isDark
                          ? "#16233B"
                          : "#FFFFFF",
                      borderColor: isSelected
                        ? isDark
                          ? "#34D399"
                          : "#6366F1"
                        : isDark
                          ? "#253347"
                          : "#F1F5F9",
                    }}
                  >
                    <View
                      className="h-11 w-11 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: cat.bgColor }}
                    >
                      <IconComp stroke={cat.iconColor} size={20} strokeWidth={2.2} />
                    </View>

                    <Text
                      className="text-[11px] font-extrabold text-center"
                      style={{
                        color: isSelected
                          ? isDark
                            ? "#FFFFFF"
                            : "#0F172A"
                          : isDark
                            ? "#94A3B8"
                            : "#475569",
                      }}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Categories list if any extra selected */}
            {allCategories.filter((c) => !CATEGORY_ITEMS.some((ci) => ci.name === c)).length >
              0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row mt-3"
              >
                {allCategories
                  .filter((c) => !CATEGORY_ITEMS.some((ci) => ci.name === c))
                  .map((catName) => {
                    const isSelected = category === catName;
                    return (
                      <TouchableOpacity
                        key={catName}
                        onPress={() => setCategory(catName)}
                        activeOpacity={0.8}
                        className="mr-2 px-3.5 py-2 rounded-full flex-row items-center border"
                        style={{
                          backgroundColor: isSelected
                            ? isDark
                              ? "#1E2A3A"
                              : "#EEF4FF"
                            : isDark
                              ? "#16233B"
                              : "#FFFFFF",
                          borderColor: isSelected
                            ? isDark
                              ? "#34D399"
                              : "#6366F1"
                            : isDark
                              ? "#253347"
                              : "#E2E8F0",
                        }}
                      >
                        <Tag
                          size={13}
                          stroke={isSelected ? (isDark ? "#34D399" : "#6366F1") : "#94A3B8"}
                          className="mr-1.5"
                        />
                        <Text
                          className="text-[12px] font-bold"
                          style={{
                            color: isSelected
                              ? isDark
                                ? "#FFFFFF"
                                : "#0F172A"
                              : isDark
                                ? "#94A3B8"
                                : "#475569",
                          }}
                        >
                          {catName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            )}
          </View>

          {/* SECTION 4: ITEM STATUS */}
          <View className="mb-6">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-2"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              ITEM STATUS
            </Text>

            <View
              className="h-14 flex-row rounded-2xl p-1.5 items-center border shadow-xs"
              style={{
                backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#D9E2FC",
              }}
            >
              {STATUS_OPTIONS.map((st) => {
                const isActive = itemStatus === st.value;

                return (
                  <TouchableOpacity
                    key={st.value}
                    onPress={() => setItemStatus(st.value)}
                    activeOpacity={0.8}
                    className="flex-1 h-full items-center justify-center rounded-xl shadow-xs"
                    style={{
                      backgroundColor: isActive ? (isDark ? "#16233B" : "#FFFFFF") : "transparent",
                    }}
                  >
                    <Text
                      className="text-[13px] font-bold"
                      style={{
                        color: isActive
                          ? isDark
                            ? "#FFFFFF"
                            : "#0F172A"
                          : isDark
                            ? "#64748B"
                            : "#64748B",
                      }}
                    >
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SECTION 5: PRIORITY LEVEL */}
          <View className="mb-6">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-2"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              PRIORITY LEVEL
            </Text>

            <View
              className="h-14 flex-row rounded-2xl p-1.5 items-center border shadow-xs"
              style={{
                backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#D9E2FC",
              }}
            >
              {PRIORITIES.map((p) => {
                const isActive = priority === p;

                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    activeOpacity={0.8}
                    className="flex-1 h-full items-center justify-center rounded-xl shadow-xs"
                    style={{
                      backgroundColor: isActive ? (isDark ? "#16233B" : "#FFFFFF") : "transparent",
                    }}
                  >
                    <Text
                      className="text-[13px] font-bold"
                      style={{
                        color: isActive
                          ? isDark
                            ? "#FFFFFF"
                            : "#0F172A"
                          : isDark
                            ? "#64748B"
                            : "#64748B",
                      }}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SECTION 6: ASSIGN TO */}
          <View className="mb-6">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-3"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              ASSIGN TO
            </Text>

            <View className="flex-row items-center gap-4">
              {assignableMembers.map((m) => {
                const isSelected = assigneeName === m.name;

                return (
                  <TouchableOpacity
                    key={m.id || m.name}
                    onPress={() => setAssigneeName(m.name)}
                    activeOpacity={0.8}
                    className="items-center"
                  >
                    <View className="relative mb-1.5">
                      <View
                        className="h-12 w-12 rounded-full items-center justify-center overflow-hidden border-2"
                        style={{
                          backgroundColor: isDark ? "#17233D" : "#006837",
                          borderColor: isSelected
                            ? isDark
                              ? "#34D399"
                              : "#006837"
                            : "transparent",
                        }}
                      >
                        {m.photoURL ? (
                          <Image source={{ uri: m.photoURL }} className="h-full w-full" />
                        ) : (
                          <Text className="text-white text-sm font-black">{toInitial(m.name)}</Text>
                        )}
                      </View>

                      {isSelected && (
                        <View
                          className="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full items-center justify-center border"
                          style={{ backgroundColor: "#006837", borderColor: "#FFFFFF" }}
                        >
                          <Check stroke="#FFFFFF" size={10} strokeWidth={3} />
                        </View>
                      )}
                    </View>

                    <Text
                      className="text-[12px] font-bold"
                      style={{
                        color: isSelected
                          ? isDark
                            ? "#FFFFFF"
                            : "#0F172A"
                          : isDark
                            ? "#94A3B8"
                            : "#64748B",
                      }}
                    >
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Anyone Option */}
              <TouchableOpacity
                onPress={() => setAssigneeName("Anyone")}
                activeOpacity={0.8}
                className="items-center"
              >
                <View
                  className="h-12 w-12 rounded-full items-center justify-center mb-1.5 border-2"
                  style={{
                    backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                    borderColor: assigneeName === "Anyone" ? colors.accent : "transparent",
                  }}
                >
                  <Users stroke={isDark ? "#34D399" : "#4F46E5"} size={20} strokeWidth={2.2} />
                </View>

                <Text
                  className="text-[12px] font-bold"
                  style={{
                    color: assigneeName === "Anyone" ? colors.textPrimary : colors.textMuted,
                  }}
                >
                  Anyone
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SECTION 7: RECURRENCE */}
          <View className="mb-6">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-2"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              RECURRENCE
            </Text>

            <View
              className="h-14 flex-row rounded-2xl p-1.5 items-center border shadow-xs"
              style={{
                backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#D9E2FC",
              }}
            >
              {RECURRENCE_OPTIONS.map((opt) => {
                const isActive = recurrenceFrequency === opt.value;

                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setRecurrenceFrequency(opt.value)}
                    activeOpacity={0.8}
                    className="flex-1 h-full items-center justify-center rounded-xl shadow-xs"
                    style={{
                      backgroundColor: isActive ? (isDark ? "#16233B" : "#FFFFFF") : "transparent",
                    }}
                  >
                    <Text
                      className="text-[13px] font-bold"
                      style={{
                        color: isActive
                          ? isDark
                            ? "#FFFFFF"
                            : "#0F172A"
                          : isDark
                            ? "#64748B"
                            : "#64748B",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SECTION 8: ADDITIONAL DETAILS */}
          <View className="mb-6">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-3"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              ADDITIONAL DETAILS
            </Text>

            {/* Notes */}
            <View className="mb-4">
              <Text
                className="text-[11px] font-bold mb-1.5"
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              >
                NOTES
              </Text>
              <View
                className="rounded-2xl px-4 py-3 border shadow-xs"
                style={{
                  backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                  borderColor: isDark ? "#253347" : "#D9E2FC",
                }}
              >
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Brand details, preferences, store notes..."
                  placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                  multiline
                  numberOfLines={3}
                  className="text-[14px] font-bold"
                  style={{
                    color: isDark ? "#FFFFFF" : "#0F172A",
                    minHeight: 60,
                    textAlignVertical: "top",
                  }}
                />
              </View>
            </View>

            {/* Dates & Financials Grid */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <DatePicker
                  label="DUE DATE"
                  placeholder="YYYY-MM-DD"
                  value={dueDateInput}
                  onChange={setDueDateInput}
                />
              </View>
              <View className="flex-1">
                <DatePicker
                  label="REMINDER"
                  placeholder="YYYY-MM-DD"
                  value={reminderAtInput}
                  onChange={setReminderAtInput}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text
                  className="text-[11px] font-bold mb-1.5"
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                >
                  UNIT PRICE ($)
                </Text>
                <View
                  className="flex-row items-center rounded-2xl px-4 h-14 border shadow-xs"
                  style={{
                    backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                    borderColor: isDark ? "#253347" : "#D9E2FC",
                  }}
                >
                  <TextInput
                    value={unitPriceInput}
                    onChangeText={setUnitPriceInput}
                    placeholder="0.00"
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    keyboardType="decimal-pad"
                    className="flex-1 text-[15px] font-bold"
                    style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                  />
                </View>
              </View>

              <View className="flex-1">
                <Text
                  className="text-[11px] font-bold mb-1.5"
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                >
                  ESTIMATED TOTAL ($)
                </Text>
                <View
                  className="flex-row items-center rounded-2xl px-4 h-14 border shadow-xs"
                  style={{
                    backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                    borderColor: isDark ? "#253347" : "#D9E2FC",
                  }}
                >
                  <TextInput
                    value={estimatedTotalInput}
                    onChangeText={setEstimatedTotalInput}
                    placeholder="0.00"
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    keyboardType="decimal-pad"
                    className="flex-1 text-[15px] font-bold"
                    style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Bottom Action Buttons */}
      <View
        className="px-5 pb-6 pt-3 border-t flex-row gap-3 items-center"
        style={{ borderTopColor: isDark ? "#253347" : "#F1F5F9" }}
      >
        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleteMutation.isPending || updateMutation.isPending}
          activeOpacity={0.8}
          className="h-14 w-14 rounded-2xl items-center justify-center border shadow-xs"
          style={{
            backgroundColor: isDark ? "#3B171A" : "#FEE2E2",
            borderColor: isDark ? "#5C2023" : "#FCA5A5",
          }}
        >
          <Trash2 stroke={isDark ? "#F87171" : "#EF4444"} size={22} strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!name.trim() || updateMutation.isPending}
          activeOpacity={0.88}
          className="h-14 flex-1 rounded-full flex-row items-center justify-center shadow-lg"
          style={{
            backgroundColor: isDark ? "#34D399" : "#006837",
            opacity: !name.trim() || updateMutation.isPending ? 0.6 : 1,
          }}
        >
          <View style={{ marginRight: 8 }}>
            <Check stroke={isDark ? "#0B132B" : "#FFFFFF"} size={20} strokeWidth={2.5} />
          </View>
          <Text
            className="text-base font-black tracking-tight"
            style={{ color: isDark ? "#0B132B" : "#FFFFFF" }}
          >
            Save Changes
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EditItemScreen;
