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
import { X, Check } from "lucide-react-native";
import { Priority, Category } from "../types";
import { addGroceryItem } from "../services/grocery";
import { addCustomCategory, subscribeToCategories, CustomCategory } from "../services/categories";
import { GROCERY_CATEGORIES } from "../features/grocery";
import { InputField, PrimaryButton, Chip, StatusModal, LoadingOverlay } from "./ui";

const CATEGORIES: Category[] = [...GROCERY_CATEGORIES];
const PRIORITIES: Priority[] = ["Low", "Medium", "Urgent"];

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  familyId: string;
  user: { uid: string; name: string };
}

/**
 * Premium Add Item Modal
 * Why: To provide a high-fidelity experience for adding groceries with elegant feedback.
 */
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
  
  const [showSuccess, setShowSuccess] = useState(false);

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
          name: name.trim(),
          category,
          priority,
          quantity: quantity.trim(),
          notes: notes.trim(),
        },
        user,
      );
      
      setShowSuccess(true);
      // Reset fields
      setName("");
      setCategory("Other");
      setPriority("Medium");
      setQuantity("");
      setNotes("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <LoadingOverlay visible={loading} />
        <StatusModal 
          visible={showSuccess}
          title="Item Added"
          message={`"${name}" has been added to your family list.`}
          onClose={handleSuccessClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="rounded-t-[40px] bg-white px-6 pb-12 pt-3 shadow-2xl"
          style={{ maxHeight: "90%" }}
        >
          <View className="mb-4 items-center">
            <View className="h-1.5 w-12 rounded-full bg-border/50" />
          </View>

          <View className="mb-8 flex-row items-center justify-between">
            <View>
              <Text className="mb-1 text-[11px] font-black uppercase tracking-[2px] text-primary-500">
                New Grocery
              </Text>
              <Text className="text-[28px] font-bold tracking-tight text-text-primary">
                Add Item
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-alt border border-border"
            >
              <X stroke="#748379" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="max-h-[65vh]"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <InputField
              label="ITEM NAME"
              placeholder="E.g. Fresh Milk, Organic Eggs"
              value={name}
              onChangeText={setName}
              containerClassName="mb-6"
              inputClassName="h-16 text-lg font-bold"
              autoFocus
            />

            <View className="flex-row gap-4 mb-6">
              <InputField
                label="QUANTITY"
                placeholder="E.g. 2L, 1 Dozen"
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
                    const activeStyle = p === "Low" ? "bg-primary-500" : p === "Medium" ? "bg-warning-DEFAULT" : "bg-danger-DEFAULT";
                    
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
                    placeholder="Category Name"
                    value={newCatInput}
                    onChangeText={setNewCatInput}
                    containerClassName="flex-1"
                    inputClassName="h-12"
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
              label="ADDITIONAL NOTES"
              placeholder="Brand, size, or specific store..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              containerClassName="mb-10"
              inputClassName="h-32 pt-4 leading-6"
              textAlignVertical="top"
            />

            <PrimaryButton
              title="Add to List"
              onPress={handleSave}
              disabled={!name.trim() || loading}
              icon={<Check size={20} stroke="#FFF" strokeWidth={2.5} />}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default AddItemModal;
