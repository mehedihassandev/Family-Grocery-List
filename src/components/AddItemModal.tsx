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
import { X, ChevronDown } from "lucide-react-native";
import { Priority, Category } from "../types";
import { addGroceryItem } from "../services/grocery";
import {
  addCustomCategory,
  subscribeToCategories,
  CustomCategory,
} from "../services/categories";

const CATEGORIES: Category[] = [
  "Fruits",
  "Vegetables",
  "Meat",
  "Fish",
  "Dairy",
  "Snacks",
  "Drinks",
  "Household",
  "Beauty",
  "Medicine",
  "Other",
];

const PRIORITIES: Priority[] = ["Low", "Medium", "Urgent"];

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  familyId: string;
  user: { uid: string; name: string };
}

const AddItemModal = ({
  visible,
  onClose,
  familyId,
  user,
}: AddItemModalProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    [],
  );
  const [newCatInput, setNewCatInput] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  useEffect(() => {
    if (!familyId || !visible) return;
    const unsubscribe = subscribeToCategories(familyId, setCustomCategories);
    return () => unsubscribe();
  }, [familyId, visible]);

  const allCategories = useMemo(() => {
    return [...CATEGORIES, ...customCategories.map((c) => c.name)];
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="bg-surface rounded-t-[50px] px-8 pt-10 pb-16 shadow-2xl"
        >
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-primary-600 font-black uppercase tracking-[2px] text-[10px] mb-1">
                New Entry
              </Text>
              <Text className="text-3xl font-black text-text-primary tracking-tight">
                Add Item
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="bg-surface-muted p-2.5 rounded-2xl border border-border-muted"
            >
              <X stroke="#748379" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="max-h-[60vh]"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="mb-8">
              <Text className="text-[11px] font-black text-text-muted mb-3 uppercase tracking-[2px] ml-1">
                ITEM NAME
              </Text>
              <TextInput
                placeholder="What needs to be bought?"
                placeholderTextColor="#95a39a"
                value={name}
                onChangeText={setName}
                className="bg-surface-muted border border-border-muted p-5 rounded-3xl text-lg font-bold text-text-primary"
                autoFocus
              />
            </View>

            <View className="flex-row mb-8">
              <View className="flex-1 mr-4">
                <Text className="text-[11px] font-black text-text-muted mb-3 uppercase tracking-[2px] ml-1">
                  QUANTITY
                </Text>
                <TextInput
                  placeholder="e.g. 2L, 5pcs"
                  placeholderTextColor="#95a39a"
                  value={quantity}
                  onChangeText={setQuantity}
                  className="bg-surface-muted border border-border-muted p-5 rounded-3xl text-lg font-bold text-text-primary"
                />
              </View>
              <View className="flex-[1.5]">
                <Text className="text-[11px] font-black text-text-muted mb-3 uppercase tracking-[2px] ml-1">
                  PRIORITY
                </Text>
                <View className="flex-row bg-surface-muted p-1.5 rounded-3xl border border-border-muted">
                  {PRIORITIES.map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      activeOpacity={0.7}
                      className={`flex-1 py-3.5 rounded-2xl items-center ${priority === p ? "bg-surface shadow-sm shadow-secondary-100/30" : ""}`}
                    >
                      <Text
                        className={`text-[10px] font-black uppercase tracking-widest ${priority === p ? "text-primary-600" : "text-text-muted"}`}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-3 px-1">
                <Text className="text-[11px] font-black text-text-muted uppercase tracking-[2px]">
                  CATEGORY
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddCat(!showAddCat)}
                  activeOpacity={0.7}
                  className="bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100"
                >
                  <Text className="text-primary-600 font-black text-[10px] uppercase tracking-wider">
                    + Custom
                  </Text>
                </TouchableOpacity>
              </View>

              {showAddCat && (
                <View className="flex-row mb-4">
                  <TextInput
                    placeholder="New Category"
                    placeholderTextColor="#95a39a"
                    value={newCatInput}
                    onChangeText={setNewCatInput}
                    className="flex-1 bg-surface-muted border border-border-muted p-4 rounded-2xl mr-3 font-bold text-text-primary"
                  />
                  <TouchableOpacity
                    onPress={handleAddCategory}
                    activeOpacity={0.8}
                    className="bg-primary-600 px-6 items-center justify-center rounded-2xl shadow-sm shadow-primary-200"
                  >
                    <Text className="text-text-inverse font-black text-xs uppercase tracking-widest">
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
                    className={`mr-3 px-8 py-3.5 rounded-full border ${category === cat ? "bg-primary-600 border-primary-600 shadow-md shadow-primary-200" : "bg-surface-muted border-border-muted"}`}
                  >
                    <Text
                      className={`font-black text-xs uppercase tracking-widest ${category === cat ? "text-text-inverse" : "text-text-muted"}`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="mb-10">
              <Text className="text-[11px] font-black text-text-muted mb-3 uppercase tracking-[2px] ml-1">
                NOTES (OPTIONAL)
              </Text>
              <TextInput
                placeholder="Any specific brand or detail?"
                placeholderTextColor="#95a39a"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                className="bg-surface-muted border border-border-muted p-5 rounded-[30px] text-base font-bold text-text-primary"
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || !name.trim()}
            activeOpacity={0.9}
            className={`w-full py-6 rounded-[30px] flex-row items-center justify-center shadow-xl ${loading || !name.trim() ? "bg-surface-subtle" : "bg-primary-600 shadow-primary-200"}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className={`font-black text-xl uppercase tracking-[2px] ${loading || !name.trim() ? "text-text-subtle" : "text-text-inverse"}`}
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
