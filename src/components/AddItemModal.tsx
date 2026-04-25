import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Priority, Category } from "../types";
import { addGroceryItem } from "../services/grocery";
import { addCustomCategory, subscribeToCategories, CustomCategory } from "../services/categories";
import { GROCERY_CATEGORIES } from "../features/grocery";
import { InputField, PrimaryButton, Chip } from "./ui";

const CATEGORIES: Category[] = [...GROCERY_CATEGORIES];
const PRIORITIES: Priority[] = ["Low", "Medium", "Urgent"];

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  familyId: string;
  user: { uid: string; name: string };
}

/**
 * Modal form to add a new grocery item
 * Why: To provide a focused, user-friendly interface for adding items with full categorization and priority options.
 */
const AddItemModal = ({ visible, onClose, familyId, user }: AddItemModalProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  useEffect(() => {
    if (!familyId || !visible) return;
    const unsubscribe = subscribeToCategories(familyId, setCustomCategories);
    return () => unsubscribe();
  }, [familyId, visible]);

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
    if (!newCatInput.trim()) return;
    try {
      await addCustomCategory(familyId, newCatInput.trim());
      setCategory(newCatInput.trim());
      setNewCatInput("");
      setShowAddCat(false);
    } catch (error) {
      console.error("[AddItemModal] error adding category:", error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      await addGroceryItem(
        familyId,
        {
          name: name.trim(),
          category,
          priority,
          quantity: quantity.trim(),
          notes: notes.trim(),
        },
        user,
      );

      // Reset and close
      setName("");
      setCategory("Other");
      setPriority("Medium");
      setQuantity("");
      setNotes("");
      onClose();
    } catch (error) {
      console.error("[AddItemModal] error saving item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="rounded-t-4xl bg-background dark:bg-background-dark px-6 pb-10 pt-3 shadow-2xl"
          style={{ maxHeight: "85%" }}
        >
          <View className="mb-4 items-center">
            <View className="h-1 w-9 rounded-full bg-handle" />
          </View>

          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary-500">
                New Entry
              </Text>
              <Text className="text-[24px] font-bold tracking-tight text-text-900 dark:text-text-dark-primary">
                Add Item
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface-muted dark:bg-surface-dark-muted border border-border-muted dark:border-border-dark"
            >
              <X stroke={isDark ? "#cbd5cf" : "#748379"} size={20} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="max-h-[70vh]"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <InputField
              label="Item Name"
              placeholder="What needs to be bought?"
              value={name}
              onChangeText={setName}
              containerClassName="mb-6"
              autoFocus
            />

            <InputField
              label="Quantity"
              placeholder="e.g. 2L, 5pcs"
              value={quantity}
              onChangeText={setQuantity}
              containerClassName="mb-6"
            />

            <View className="mb-6">
              <Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted dark:text-text-dark-muted">
                Priority
              </Text>
              <View className="h-11 flex-row rounded-md bg-surface-muted dark:bg-surface-dark-muted p-1 items-center">
                {PRIORITIES.map((p) => {
                  const isActive = priority === p;
                  const activeStyle =
                    p === "Low" ? "bg-primary-100" : p === "Medium" ? "bg-warning-light" : "bg-danger-light";
                  const activeText =
                    p === "Low"
                      ? "text-primary-600"
                      : p === "Medium"
                        ? "text-warning-dark"
                        : "text-danger-dark";

                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      activeOpacity={0.75}
                      className={`flex-1 items-center justify-center rounded-sm h-full ${
                        isActive ? activeStyle : ""
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-bold uppercase tracking-wide ${
                          isActive ? activeText : "text-text-muted dark:text-text-dark-muted"
                        }`}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mb-6">
              <View className="mb-3 flex-row items-center justify-between px-1">
                <Text className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted dark:text-text-dark-muted">
                  Category
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
                <View className="mb-4 flex-row gap-2">
                  <InputField
                    placeholder="New Category"
                    value={newCatInput}
                    onChangeText={setNewCatInput}
                    containerClassName="flex-1"
                  />
                  <TouchableOpacity
                    onPress={handleAddCategory}
                    activeOpacity={0.8}
                    className="h-12 items-center justify-center rounded-2xl bg-primary-600 dark:bg-primary-500 px-6"
                  >
                    <Text className="text-[11px] font-black uppercase tracking-wide text-white">
                      Add
                    </Text>
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
                    className="mr-2"
                  />
                ))}
              </ScrollView>
            </View>

            <InputField
              label="Notes (Optional)"
              placeholder="Any specific brand or detail?"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              containerClassName="mb-8"
              inputClassName="h-24 pt-3"
              textAlignVertical="top"
            />

            <PrimaryButton
              title="Add to List"
              onPress={handleSave}
              loading={loading}
              disabled={!name.trim()}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default AddItemModal;
