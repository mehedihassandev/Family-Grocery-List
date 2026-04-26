import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { X, Check, Trash2 } from "lucide-react-native";
import { Category, IGroceryItem, Priority } from "../types";
import { deleteGroceryItem, updateGroceryItem } from "../services/grocery";
import { addCustomCategory, ICustomCategory, subscribeToCategories } from "../services/categories";
import { GROCERY_CATEGORIES } from "../features/grocery";
import { InputField, PrimaryButton, Chip, LoadingOverlay, StatusModal } from "./ui";

const CATEGORIES: Category[] = [...GROCERY_CATEGORIES];
const PRIORITIES: Priority[] = ["Low", "Medium", "Urgent"];

interface IEditItemModalProps {
  visible: boolean;
  onClose: () => void;
  item: IGroceryItem | null;
  familyId: string;
}

/**
 * Premium Edit Item Modal
 * Why: To provide a high-fidelity experience for updating groceries with elegant feedback and safety confirmations.
 * @param props - Component props including visibility, item data, and family context
 */
const EditItemModal = ({ visible, onClose, item, familyId }: IEditItemModalProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [customCategories, setCustomCategories] = useState<ICustomCategory[]>([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal states
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
        source.findIndex((value) => value.toLowerCase() === categoryName.toLowerCase()) === index,
    );
  }, [customCategories]);

  /**
   * Adds a new custom category to the family list
   */
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

  /**
   * Saves updates to the grocery item
   */
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

  /**
   * Prompts user for confirmation before deleting an item
   */
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
          onClose();
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

  if (!item) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
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
            if (isSuccess) onClose();
          }}
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
                Update Entry
              </Text>
              <Text className="text-[28px] font-bold tracking-tight text-text-primary">
                Edit Item
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
    </Modal>
  );
};

export default EditItemModal;
