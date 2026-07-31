import React, { useMemo, useState } from "react";
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
  ShoppingCart,
  Users,
  Check,
  Apple,
  Fish,
  Egg,
  IceCream,
  Snowflake,
  CupSoda,
  Home,
  Leaf,
} from "lucide-react-native";
import { AuthenticatedStackNavigatorScreenProps, Priority, ROUTES, TItemUnit } from "../types";
import {
  useAddGroceryItemBackend,
  useFamilyMembers,
  useAppTheme,
  useTextFormatter,
} from "../hooks";
import { useAuthStore } from "../store/useAuthStore";
import { LoadingOverlay, StatusModal, ScannerModal } from "../components/ui";

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

/**
 * Add Item Screen redesigned to match exact modern UI mockup
 */
const AddItemScreen = ({
  navigation,
}: AuthenticatedStackNavigatorScreenProps<typeof ROUTES.ADD_ITEM>) => {
  const { user } = useAuthStore();
  const { isDark, colors } = useAppTheme();
  const { toInitial } = useTextFormatter();
  const familyId = user?.familyId || "";

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Produce");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [quantityCount, setQuantityCount] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<TItemUnit>("pcs");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [assigneeName, setAssigneeName] = useState("Sarah");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
  const addMutation = useAddGroceryItemBackend(familyId);

  const [showSuccess, setShowSuccess] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

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
    if (!name.trim()) return;
    if (!familyId || !user?.uid) {
      setStatusModal({
        visible: true,
        title: "Add Failed",
        message: "Family membership required before adding items.",
        type: "error",
      });
      return;
    }

    addMutation.mutate(
      {
        name: name.trim(),
        category,
        priority,
        quantity: `${quantityCount}`,
        unit: selectedUnit,
        assignee:
          assigneeName.trim() && assigneeName !== "Anyone" ? { name: assigneeName.trim() } : null,
      },
      {
        onSuccess: () => {
          setShowSuccess(true);
        },
        onError: (error) => {
          setStatusModal({
            visible: true,
            title: "Add Failed",
            message: error instanceof Error ? error.message : "Could not add item. Please retry.",
            type: "error",
          });
        },
      },
    );
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigation.goBack();
  };

  const activeUnitObj = useMemo(
    () => UNITS.find((u) => u.value === selectedUnit) || UNITS[0],
    [selectedUnit],
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
    >
      <LoadingOverlay visible={addMutation.isPending} />
      <StatusModal
        visible={showSuccess}
        title="Item Added"
        message={`"${name}" has been added to your family list.`}
        onClose={handleSuccessClose}
      />
      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
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
          Add Item
        </Text>

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 px-5"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
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

            {/* Suggestions Horizontal Chips */}
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

          {/* SECTION 3: CATEGORY (4x2 Grid) */}
          <View className="mb-6">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-3"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              CATEGORY
            </Text>

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
          </View>

          {/* SECTION 4: PRIORITY LEVEL */}
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

          {/* SECTION 5: ASSIGN TO */}
          <View className="mb-6">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-3"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              ASSIGN TO
            </Text>

            <View className="flex-row items-center gap-4">
              {/* Family Members (Excluding Current User) */}
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

              {/* Anyone Fallback Option */}
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Bottom Action Button */}
      <View
        className="px-5 pb-6 pt-3 border-t"
        style={{ borderTopColor: isDark ? "#253347" : "#F1F5F9" }}
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={!name.trim() || addMutation.isPending}
          activeOpacity={0.88}
          className="h-14 w-full rounded-full flex-row items-center justify-center shadow-lg"
          style={{
            backgroundColor: isDark ? "#34D399" : "#006837",
            opacity: !name.trim() || addMutation.isPending ? 0.6 : 1,
          }}
        >
          <View style={{ marginRight: 8 }}>
            <ShoppingCart stroke={isDark ? "#0B132B" : "#FFFFFF"} size={20} strokeWidth={2.5} />
          </View>
          <Text
            className="text-base font-black tracking-tight"
            style={{ color: isDark ? "#0B132B" : "#FFFFFF" }}
          >
            Add to List
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddItemScreen;
