import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { X, Check, Trash2 } from "lucide-react-native";
import { AuthenticatedStackNavigatorScreenProps, Category, IGroceryItem, Priority } from "../types";
import { deleteGroceryItem, updateGroceryItem, getGroceryItem } from "../services/grocery";
import { addCustomCategory, ICustomCategory, subscribeToCategories } from "../services/categories";
import { GROCERY_CATEGORIES } from "../features/grocery";
import { InputField, PrimaryButton, Chip, LoadingOverlay, StatusModal } from "../components/ui";
import { useAuthStore } from "../store/useAuthStore";

const CATEGORIES: Category[] = [...GROCERY_CATEGORIES];
const PRIORITIES: Priority[] = ["Low", "Medium", "Urgent"];

import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Edit Item Screen
 * Why: To provide a robust editing experience that maintains correct navigation context.
 */
const EditItemScreen = ({ route, navigation }: AuthenticatedStackNavigatorScreenProps<"EditItem">) => {
  const insets = useSafeAreaInsets();
  const { itemId } = route.params;
  const { user } = useAuthStore();
  const familyId = user?.familyId || "";

  const [item, setItem] = useState<IGroceryItem | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [customCategories, setCustomCategories] = useState<ICustomCategory[]>([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
    const fetchItem = async () => {
      try {
        const data = await getGroceryItem(itemId);
        if (data) {
          setItem(data);
          setName(data.name);
          setCategory(data.category || "Other");
          setPriority(data.priority || "Medium");
          setQuantity(data.quantity || "");
          setNotes(data.notes || "");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

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
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!item || !name.trim()) return;
    setLoading(true);
    try {
      await updateGroceryItem(item.id, {
        name: name.trim(),
        category,
        priority,
        quantity: quantity.trim(),
        notes: notes.trim(),
      });
      setStatusModal({
        visible: true,
        title: "Item Updated",
        message: "Your changes have been saved successfully.",
        type: "success",
      });
    } catch (error) {
      setStatusModal({
        visible: true,
        title: "Update Failed",
        message: "Could not save changes. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
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
        setLoading(true);
        try {
          await deleteGroceryItem(item.id);
          navigation.navigate("Root");
        } catch (error) {
          setStatusModal({
            visible: true,
            title: "Delete Failed",
            message: "Could not delete item. Please try again.",
            type: "error",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3DB87A" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: Math.max(insets.top, 20) }}>
      <LoadingOverlay visible={loading} />
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white px-6"
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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
                disabled={!name.trim() || loading}
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
