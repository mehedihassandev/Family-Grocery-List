import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { X } from "lucide-react-native";
import { Priority, Category } from "../types";
import { addGroceryItem } from "../services/grocery";
import { addCustomCategory, subscribeToCategories, CustomCategory } from "../services/categories";
import { GROCERY_CATEGORIES } from "../features/grocery";

const CATEGORIES: Category[] = [...GROCERY_CATEGORIES];

const PRIORITIES: Priority[] = ["Low", "Medium", "Urgent"];

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  familyId: string;
  user: { uid: string; name: string };
}

const AddItemModal = ({ visible, onClose, familyId, user }: AddItemModalProps) => {
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
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      await addGroceryItem(
        familyId,
        {
          name,
          category,
          priority,
          quantity,
          notes,
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.28)" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="rounded-t-[30px] bg-surface px-5 pb-8 pt-3 shadow-2xl"
        >
          <View className="mb-4 items-center">
            <View className="h-1 w-12 rounded-full bg-border-muted" />
          </View>

          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text className="mb-1 text-[10px] font-bold uppercase tracking-[2px] text-primary-600">
                New Entry
              </Text>
              <Text className="text-[34px] font-black tracking-tight text-text-primary">
                Add Item
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="rounded-xl border border-border-muted bg-surface-muted p-2"
            >
              <X stroke="#748379" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="max-h-[68vh]"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <View className="mb-6">
              <Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                Item Name
              </Text>
              <TextInput
                placeholder="What needs to be bought?"
                placeholderTextColor="#95a39a"
                value={name}
                onChangeText={setName}
                className="h-[52px] rounded-2xl border border-border-muted bg-surface-muted px-4 text-[16px] font-semibold text-text-primary"
                autoFocus
              />
            </View>

            <View className="mb-6 flex-row">
              <View className="mr-4 flex-1">
                <Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                  Quantity
                </Text>
                <TextInput
                  placeholder="e.g. 2L, 5pcs"
                  placeholderTextColor="#95a39a"
                  value={quantity}
                  onChangeText={setQuantity}
                  className="h-[52px] rounded-2xl border border-border-muted bg-surface-muted px-4 text-[16px] font-semibold text-text-primary"
                />
              </View>
              <View className="flex-[1.5]">
                <Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                  Priority
                </Text>
                <View className="h-[52px] flex-row rounded-2xl border border-border-muted bg-surface-muted p-1 items-center">
                  {PRIORITIES.map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      activeOpacity={0.7}
                      className={`flex-1 items-center justify-center rounded-xl h-full ${priority === p ? "bg-surface" : ""}`}
                    >
                      <Text
                        className={`text-[11px] font-bold uppercase tracking-widest ${priority === p ? "text-primary-700" : "text-text-muted"}`}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View className="mb-5">
              <View className="mb-2 flex-row items-center justify-between px-1">
                <Text className="text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                  Category
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddCat(!showAddCat)}
                  activeOpacity={0.7}
                  className="rounded-md px-2 py-1"
                >
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-primary-700">
                    + Custom
                  </Text>
                </TouchableOpacity>
              </View>

              {showAddCat && (
                <View className="mb-3 flex-row">
                  <TextInput
                    placeholder="New Category"
                    placeholderTextColor="#95a39a"
                    value={newCatInput}
                    onChangeText={setNewCatInput}
                    className="mr-2 h-11 flex-1 rounded-xl border border-border-muted bg-surface-muted px-3 font-semibold text-text-primary"
                  />
                  <TouchableOpacity
                    onPress={handleAddCategory}
                    activeOpacity={0.8}
                    className="items-center justify-center rounded-xl bg-primary-600 px-5"
                  >
                    <Text className="text-xs font-bold uppercase tracking-wide text-text-inverse">
                      Add
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
                contentContainerStyle={{ paddingHorizontal: 2 }}
              >
                {allCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.8}
                    className={`mr-2 rounded-lg border px-4 py-2.5 ${category === cat ? "border-primary-300 bg-primary-50" : "border-border-muted bg-surface-muted"}`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase tracking-wide ${category === cat ? "text-primary-700" : "text-text-muted"}`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="mb-7">
              <Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                Notes (Optional)
              </Text>
              <TextInput
                placeholder="Any specific brand or detail?"
                placeholderTextColor="#95a39a"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                className="rounded-xl border border-border-muted bg-surface-muted px-4 py-3 text-sm font-semibold text-text-primary"
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || !name.trim()}
            activeOpacity={0.9}
            className={`w-full h-14 rounded-2xl flex-row items-center justify-center ${loading || !name.trim() ? "bg-surface-subtle" : "bg-primary-600"}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className={`font-bold text-[16px] uppercase tracking-[1px] ${loading || !name.trim() ? "text-text-subtle" : "text-text-inverse"}`}
              >
                Add to List
              </Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default AddItemModal;
