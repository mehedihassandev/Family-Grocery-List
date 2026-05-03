import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { X, Check, Trash2 } from "lucide-react-native";
import { AuthenticatedStackNavigatorScreenProps, Category, Priority, ERootRoutes } from "../types";
import {
  useGroceryItem,
  useUpdateGroceryItem,
  useDeleteGroceryItem,
} from "../hooks/queries/useGroceryQueries";
import { addCustomCategory, ICustomCategory, subscribeToCategories } from "../services/categories";
import { GROCERY_CATEGORIES } from "../features/grocery";
import { InputField, PrimaryButton, Chip, LoadingOverlay, StatusModal } from "../components/ui";
import { useAuthStore } from "../store/useAuthStore";

import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIES: Category[] = [...GROCERY_CATEGORIES];
const PRIORITIES: Priority[] = ["Low", "Medium", "Urgent"];
const RECURRENCE_OPTIONS: ("none" | "weekly" | "monthly")[] = ["none", "weekly", "monthly"];

/**
 * Edit Item Screen
 * Why: To provide a robust editing experience that maintains correct navigation context.
 */
const EditItemScreen = ({
  route,
  navigation,
}: AuthenticatedStackNavigatorScreenProps<ERootRoutes.EDIT_ITEM>) => {
  const insets = useSafeAreaInsets();
  const { itemId } = route.params;
  const { user } = useAuthStore();
  const familyId = user?.familyId || "";

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"none" | "weekly" | "monthly">(
    "none",
  );
  const [assigneeName, setAssigneeName] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [reminderAtInput, setReminderAtInput] = useState("");
  const [unitPriceInput, setUnitPriceInput] = useState("");
  const [estimatedTotalInput, setEstimatedTotalInput] = useState("");
  const [customCategories, setCustomCategories] = useState<ICustomCategory[]>([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  // TanStack Query Hooks
  const { data: item, isLoading: initialLoading } = useGroceryItem(itemId);
  const updateMutation = useUpdateGroceryItem();
  const deleteMutation = useDeleteGroceryItem();

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
      setName(item.name);
      setCategory(item.category || "Other");
      setPriority(item.priority || "Medium");
      setQuantity(item.quantity || "");
      setNotes(item.notes || "");
      setRecurrenceFrequency(item.recurrenceFrequency || "none");
      setAssigneeName(item.assignee?.name || "");
      if (item.dueDate?.toDate) {
        setDueDateInput(item.dueDate.toDate().toISOString().slice(0, 10));
      } else if (item.dueDate instanceof Date) {
        setDueDateInput(item.dueDate.toISOString().slice(0, 10));
      } else if (typeof item.dueDate === "string") {
        setDueDateInput(item.dueDate.slice(0, 10));
      } else {
        setDueDateInput("");
      }
      if (item.reminderAt?.toDate) {
        setReminderAtInput(item.reminderAt.toDate().toISOString().slice(0, 10));
      } else if (item.reminderAt instanceof Date) {
        setReminderAtInput(item.reminderAt.toISOString().slice(0, 10));
      } else if (typeof item.reminderAt === "string") {
        setReminderAtInput(item.reminderAt.slice(0, 10));
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
    const normalizedCustomCategories = customCategories
      .map((categoryItem) => categoryItem.name.trim())
      .filter(Boolean);

    return [...CATEGORIES, ...normalizedCustomCategories].filter(
      (categoryName, index, source) =>
        source.findIndex((value) => value.toLowerCase() === categoryName.toLowerCase()) === index,
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

  const handleSave = async () => {
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
        updates: {
          name: name.trim(),
          category,
          priority,
          quantity: quantity.trim(),
          notes: notes.trim(),
          recurrenceFrequency,
          assignee: assigneeName.trim() ? { name: assigneeName.trim() } : null,
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
            message: "Your changes have been saved successfully.",
            type: "success",
          });
        },
        onError: (error) => {
          console.error("Update failed:", error);
          setStatusModal({
            visible: true,
            title: "Update Failed",
            message: "Could not save changes. Please try again.",
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
      message: `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
      type: "confirm",
      onConfirm: async () => {
        setStatusModal((prev) => ({ ...prev, visible: false }));
        deleteMutation.mutate(item.id, {
          onSuccess: () => {
            navigation.navigate("Root");
          },
          onError: (error) => {
            console.error("Delete failed:", error);
            setStatusModal({
              visible: true,
              title: "Delete Failed",
              message: "Could not delete item. Please try again.",
              type: "error",
            });
          },
        });
      },
    });
  };

  if (!itemId) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-muted">No item ID provided</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-primary-600 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#10B981" size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-muted">Item not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-primary-600 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: Math.max(insets.top, 20) }}>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 px-6"
      >
        <View className="mb-8 flex-row items-center justify-between">
          <View>
            <Text className="mb-1 text-[11px] font-black uppercase tracking-[2px] text-primary-500">
              Update Entry
            </Text>
            <Text className="text-[28px] font-bold tracking-tight text-text-primary">
              Edit Item
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-alt border border-border"
          >
            <X stroke="#748379" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <InputField
            label="ITEM NAME"
            placeholder="What needs to be bought?"
            value={name}
            onChangeText={setName}
            containerClassName="mb-6"
            inputClassName="h-16 text-lg font-bold"
          />

          <View className="flex-row gap-4 mb-6">
            <InputField
              label="QUANTITY"
              placeholder="e.g. 2L, 5pcs"
              value={quantity}
              onChangeText={setQuantity}
              containerClassName="flex-1"
              inputClassName="h-14 font-bold"
            />
            <View className="flex-1">
              <Text className="mb-2 ml-1 text-[11px] font-black uppercase tracking-[1.5px] text-text-muted">
                PRIORITY
              </Text>
              <View className="h-14 flex-row rounded-2xl bg-surface-alt p-1.5 items-center border border-border">
                {PRIORITIES.map((p) => {
                  const isActive = priority === p;
                  const activeStyle =
                    p === "Low"
                      ? "bg-primary-500"
                      : p === "Medium"
                        ? "bg-warning-DEFAULT"
                        : "bg-danger-DEFAULT";

                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      activeOpacity={0.75}
                      className={`flex-1 items-center justify-center rounded-xl h-full ${
                        isActive ? activeStyle : ""
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-black uppercase tracking-wider ${
                          isActive ? "text-white" : "text-text-muted"
                        }`}
                      >
                        {p.charAt(0)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View className="mb-8">
            <View className="mb-4 flex-row items-center justify-between px-1">
              <Text className="text-[11px] font-black uppercase tracking-[1.5px] text-text-muted">
                CATEGORY
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddCat(!showAddCat)}
                activeOpacity={0.75}
                className="rounded-full border border-primary-500 px-3 py-1"
              >
                <Text className="text-[10px] font-bold uppercase tracking-wider text-primary-500">
                  {showAddCat ? "Cancel" : "+ Custom"}
                </Text>
              </TouchableOpacity>
            </View>

            {showAddCat && (
              <View className="mb-6 flex-row gap-2">
                <InputField
                  placeholder="New Category"
                  value={newCatInput}
                  onChangeText={setNewCatInput}
                  containerClassName="flex-1"
                />
                <TouchableOpacity
                  onPress={handleAddCategory}
                  activeOpacity={0.8}
                  className="h-12 items-center justify-center rounded-2xl bg-primary-600 px-6"
                >
                  <Check stroke="white" size={18} strokeWidth={3} />
                </TouchableOpacity>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {allCategories.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                  className="mr-3"
                />
              ))}
            </ScrollView>
          </View>

          <InputField
            label="NOTES"
            placeholder="Any specific brand or detail?"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            containerClassName="mb-10"
            inputClassName="h-32 pt-4 leading-6"
            textAlignVertical="top"
          />

          <View className="mb-6">
            <Text className="mb-2 ml-1 text-[11px] font-black uppercase tracking-[1.5px] text-text-muted">
              RECURRING
            </Text>
            <View className="flex-row gap-2">
              {RECURRENCE_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  label={option === "none" ? "One-time" : option}
                  selected={recurrenceFrequency === option}
                  onPress={() => setRecurrenceFrequency(option)}
                  className="mr-2"
                />
              ))}
            </View>
          </View>

          <View className="mb-6 flex-row gap-3">
            <InputField
              label="ASSIGNEE"
              placeholder="Name (optional)"
              value={assigneeName}
              onChangeText={setAssigneeName}
              containerClassName="flex-1"
            />
            <InputField
              label="DUE DATE"
              placeholder="YYYY-MM-DD"
              value={dueDateInput}
              onChangeText={setDueDateInput}
              containerClassName="flex-1"
            />
          </View>

          <View className="mb-10 flex-row gap-3">
            <InputField
              label="REMINDER"
              placeholder="YYYY-MM-DD"
              value={reminderAtInput}
              onChangeText={setReminderAtInput}
              containerClassName="flex-1"
            />
            <InputField
              label="UNIT PRICE"
              placeholder="e.g. 5.99"
              value={unitPriceInput}
              onChangeText={setUnitPriceInput}
              keyboardType="decimal-pad"
              containerClassName="flex-1"
            />
          </View>

          <InputField
            label="ESTIMATED TOTAL"
            placeholder="e.g. 24.50"
            value={estimatedTotalInput}
            onChangeText={setEstimatedTotalInput}
            keyboardType="decimal-pad"
            containerClassName="mb-10"
          />

          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.8}
              className="h-16 w-16 items-center justify-center rounded-2xl bg-danger-light border border-danger/20"
            >
              <Trash2 stroke="#E55C5C" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
            <View className="flex-1">
              <PrimaryButton
                title="Save Changes"
                onPress={handleSave}
                disabled={!name.trim() || updateMutation.isPending}
                icon={<Check size={20} stroke="#FFF" strokeWidth={2.5} />}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditItemScreen;
