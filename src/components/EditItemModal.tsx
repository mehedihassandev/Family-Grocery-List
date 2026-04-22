import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { Category, GroceryItem, Priority } from "../types";
import { deleteGroceryItem, updateGroceryItem } from "../services/grocery";
import {
  addCustomCategory,
  CustomCategory,
  subscribeToCategories,
} from "../services/categories";
import { GROCERY_CATEGORIES } from "../features/grocery";

const CATEGORIES: Category[] = [...GROCERY_CATEGORIES];
const PRIORITIES: Priority[] = ["Low", "Medium", "Urgent"];

interface EditItemModalProps {
  visible: boolean;
  onClose: () => void;
  item: GroceryItem | null;
  familyId: string;
}

const EditItemModal = ({
  visible,
  onClose,
  item,
  familyId,
}: EditItemModalProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    [],
  );
  const [newCatInput, setNewCatInput] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!item || !visible) return;
    setName(item.name);
    setCategory(item.category || "Other");
    setPriority(item.priority || "Medium");
    setQuantity(item.quantity || "");
    setNotes(item.notes || "");
  }, [item?.id, visible]);

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
        source.findIndex(
          (value) => value.toLowerCase() === categoryName.toLowerCase(),
        ) === index,
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

    try {
      setSaving(true);
      await updateGroceryItem(item.id, {
        name: name.trim(),
        category,
        priority,
        quantity: quantity.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert("Update failed", "Could not save item changes.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!item || deleting) return;

    Alert.alert("Delete item?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteGroceryItem(item.id);
            onClose();
          } catch (error) {
            console.error(error);
            Alert.alert("Delete failed", "Could not delete this item.");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="rounded-t-[50px] bg-surface px-8 pb-16 pt-10 shadow-2xl"
        >
          <View className="mb-8 flex-row items-center justify-between">
            <View>
              <Text className="mb-1 text-[10px] font-black uppercase tracking-[2px] text-primary-600">
                Edit Entry
              </Text>
              <Text className="text-3xl font-black tracking-tight text-text-primary">
                Update Item
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="rounded-2xl border border-border-muted bg-surface-muted p-2.5"
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
              <Text className="ml-1 mb-3 text-[11px] font-black uppercase tracking-[2px] text-text-muted">
                ITEM NAME
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="What needs to be bought?"
                placeholderTextColor="#95a39a"
                className="rounded-3xl border border-border-muted bg-surface-muted p-5 text-lg font-bold text-text-primary"
              />
            </View>

            <View className="mb-8 flex-row">
              <View className="mr-4 flex-1">
                <Text className="ml-1 mb-3 text-[11px] font-black uppercase tracking-[2px] text-text-muted">
                  QUANTITY
                </Text>
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="e.g. 2L, 5pcs"
                  placeholderTextColor="#95a39a"
                  className="rounded-3xl border border-border-muted bg-surface-muted p-5 text-lg font-bold text-text-primary"
                />
              </View>
              <View className="flex-[1.5]">
                <Text className="ml-1 mb-3 text-[11px] font-black uppercase tracking-[2px] text-text-muted">
                  PRIORITY
                </Text>
                <View className="flex-row rounded-3xl border border-border-muted bg-surface-muted p-1.5">
                  {PRIORITIES.map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setPriority(level)}
                      activeOpacity={0.7}
                      className={`flex-1 items-center rounded-2xl py-3.5 ${priority === level ? "bg-surface shadow-sm shadow-secondary-100/30" : ""}`}
                    >
                      <Text
                        className={`text-[10px] font-black uppercase tracking-widest ${priority === level ? "text-primary-600" : "text-text-muted"}`}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View className="mb-8">
              <View className="mb-3 flex-row items-center justify-between px-1">
                <Text className="text-[11px] font-black uppercase tracking-[2px] text-text-muted">
                  CATEGORY
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddCat((prev) => !prev)}
                  activeOpacity={0.7}
                  className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-1.5"
                >
                  <Text className="text-[10px] font-black uppercase tracking-wider text-primary-600">
                    + Custom
                  </Text>
                </TouchableOpacity>
              </View>

              {showAddCat ? (
                <View className="mb-4 flex-row">
                  <TextInput
                    value={newCatInput}
                    onChangeText={setNewCatInput}
                    placeholder="New Category"
                    placeholderTextColor="#95a39a"
                    className="mr-3 flex-1 rounded-2xl border border-border-muted bg-surface-muted p-4 font-bold text-text-primary"
                  />
                  <TouchableOpacity
                    onPress={handleAddCategory}
                    activeOpacity={0.8}
                    className="items-center justify-center rounded-2xl bg-primary-600 px-6 shadow-sm shadow-primary-200"
                  >
                    <Text className="text-xs font-black uppercase tracking-widest text-text-inverse">
                      Add
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 2 }}
              >
                {allCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.8}
                    className={`mr-3 rounded-full border px-8 py-3.5 ${category === cat ? "border-primary-600 bg-primary-600 shadow-md shadow-primary-200" : "border-border-muted bg-surface-muted"}`}
                  >
                    <Text
                      className={`text-xs font-black uppercase tracking-widest ${category === cat ? "text-text-inverse" : "text-text-muted"}`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="mb-10">
              <Text className="ml-1 mb-3 text-[11px] font-black uppercase tracking-[2px] text-text-muted">
                NOTES (OPTIONAL)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any specific brand or detail?"
                placeholderTextColor="#95a39a"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="rounded-[30px] border border-border-muted bg-surface-muted p-5 text-base font-bold text-text-primary"
              />
            </View>
          </ScrollView>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={confirmDelete}
              disabled={saving || deleting}
              activeOpacity={0.9}
              className={`flex-1 rounded-[30px] border border-urgent/25 py-5 ${saving || deleting ? "bg-surface-subtle" : "bg-urgent/10"}`}
            >
              {deleting ? (
                <ActivityIndicator color="#c36262" />
              ) : (
                <Text className="text-center text-base font-black uppercase tracking-[1px] text-urgent">
                  Delete
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || deleting || !name.trim()}
              activeOpacity={0.9}
              className={`flex-1 rounded-[30px] py-5 ${saving || deleting || !name.trim() ? "bg-surface-subtle" : "bg-primary-600 shadow-xl shadow-primary-200"}`}
            >
              {saving ? (
                <ActivityIndicator color="#f6fbf7" />
              ) : (
                <Text
                  className={`text-center text-base font-black uppercase tracking-[1px] ${saving || deleting || !name.trim() ? "text-text-subtle" : "text-text-inverse"}`}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default EditItemModal;
