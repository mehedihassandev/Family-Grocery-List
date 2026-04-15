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
        const unsubscribe = subscribeToCategories(
            familyId,
            setCustomCategories,
        );
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
            <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="bg-white rounded-t-[40px] px-6 pt-8 pb-12"
                >
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-2xl font-bold text-gray-900">
                            Add New Item
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="bg-gray-100 p-2 rounded-full"
                        >
                            <X stroke="#4b5563" size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        className="max-h-[60vh]"
                    >
                        <View className="mb-6">
                            <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                Item Name
                            </Text>
                            <TextInput
                                placeholder="Ex. Milk, Appels, etc."
                                value={name}
                                onChangeText={setName}
                                className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-lg font-medium"
                                autoFocus
                            />
                        </View>

                        <View className="flex-row mb-6">
                            <View className="flex-1 mr-3">
                                <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                    Quantity
                                </Text>
                                <TextInput
                                    placeholder="Ex. 2L, 1kg"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-lg"
                                />
                            </View>
                            <View className="flex-[1.5]">
                                <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                    Priority
                                </Text>
                                <View className="flex-row bg-gray-50 p-1 rounded-2xl border border-gray-100">
                                    {PRIORITIES.map((p) => (
                                        <TouchableOpacity
                                            key={p}
                                            onPress={() => setPriority(p)}
                                            className={`flex-1 py-3 rounded-xl items-center ${priority === p ? 'bg-white' : ''}`}
                                        >
                                            <Text
                                                className={`text-xs font-bold ${priority === p ? "text-primary-600" : "text-gray-400"}`}
                                            >
                                                {p}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View className="mb-6">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                    Category
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowAddCat(!showAddCat)}
                                >
                                    <Text className="text-primary-600 font-bold text-xs">
                                        + Custom
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showAddCat && (
                                <View className="flex-row mb-3">
                                    <TextInput
                                        placeholder="New Category"
                                        value={newCatInput}
                                        onChangeText={setNewCatInput}
                                        className="flex-1 bg-gray-50 border border-gray-100 p-3 rounded-xl mr-2"
                                    />
                                    <TouchableOpacity
                                        onPress={handleAddCategory}
                                        className="bg-primary-600 px-4 items-center justify-center rounded-xl"
                                    >
                                        <Text className="text-white font-bold">
                                            Add
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="flex-row"
                            >
                                {allCategories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setCategory(cat)}
                                        className={`mr-2 px-6 py-3 rounded-full border ${category === cat ? "bg-primary-600 border-primary-600" : "bg-white border-gray-100"}`}
                                    >
                                        <Text
                                            className={`font-semibold ${category === cat ? "text-white" : "text-gray-600"}`}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View className="mb-8">
                            <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                Notes (Optional)
                            </Text>
                            <TextInput
                                placeholder="Any specific brand or detail?"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                                className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-lg"
                                textAlignVertical="top"
                            />
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading || !name.trim()}
                        className={`w-full py-5 rounded-2xl flex-row items-center justify-center ${loading || !name.trim() ? "bg-gray-200" : "bg-primary-600"}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-xl">
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
