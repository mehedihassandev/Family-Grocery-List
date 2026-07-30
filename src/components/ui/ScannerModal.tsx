import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Camera, X, Scan, Sparkles, Check, Package, FileText } from "lucide-react-native";
import { Category, Priority } from "../../types";
import { useAppTheme } from "../../hooks";

interface IScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScannedItem: (item: {
    name: string;
    category: Category;
    quantity: string;
    priority: Priority;
    estimatedPrice?: number;
  }) => void;
}

const SAMPLE_BARCODES = [
  {
    name: "Organic Whole Milk 1 Gal",
    category: "Dairy" as Category,
    quantity: "1 Gal",
    priority: "Urgent" as Priority,
    estimatedPrice: 4.49,
  },
  {
    name: "Avocado Bags (6 Count)",
    category: "Fruits" as Category,
    quantity: "1 Bag",
    priority: "Medium" as Priority,
    estimatedPrice: 5.99,
  },
  {
    name: "Extra Virgin Olive Oil 500ml",
    category: "Household" as Category,
    quantity: "1 Bottle",
    priority: "Medium" as Priority,
    estimatedPrice: 8.99,
  },
  {
    name: "Greek Yogurt Vanilla 32oz",
    category: "Dairy" as Category,
    quantity: "1 Tub",
    priority: "Low" as Priority,
    estimatedPrice: 3.99,
  },
];

/**
 * Smart Barcode & Receipt Scanner Modal UX
 * Why: Rapid 1-tap product scanning and quick-add to list.
 */
export const ScannerModal: React.FC<IScannerModalProps> = ({ visible, onClose, onScannedItem }) => {
  const [scanningMode, setScanningMode] = useState<"barcode" | "receipt">("barcode");
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<(typeof SAMPLE_BARCODES)[0] | null>(null);
  const { colors } = useAppTheme();

  const handleSimulateScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsSimulatingScan(true);
    setScannedProduct(null);

    setTimeout(() => {
      const randomItem = SAMPLE_BARCODES[Math.floor(Math.random() * SAMPLE_BARCODES.length)];
      setScannedProduct(randomItem);
      setIsSimulatingScan(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 1200);
  };

  const handleAddScannedItem = () => {
    if (!scannedProduct) return;
    onScannedItem(scannedProduct);
    onClose();
    setScannedProduct(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-slate-900/60">
        <Animated.View
          entering={FadeInUp.duration(300).springify()}
          className="rounded-t-3xl p-6 border-t shadow-lg"
          style={{ backgroundColor: colors.bgCard, borderTopColor: colors.border }}
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between pb-4 border-b mb-4"
            style={{ borderBottomColor: colors.border }}
          >
            <View className="flex-row items-center">
              <View
                className="h-10 w-10 items-center justify-center rounded-xl mr-3"
                style={{ backgroundColor: colors.accentLightSubtle }}
              >
                <Camera stroke={colors.accent} size={20} strokeWidth={2.5} />
              </View>
              <View>
                <Text className="text-[17px] font-black" style={{ color: colors.textPrimary }}>
                  Quick Product Scanner
                </Text>
                <Text className="text-[12px] font-medium" style={{ color: colors.textMuted }}>
                  Scan barcode or receipt to auto-fill
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close scanner"
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.bgInput }}
            >
              <X stroke={colors.icon} size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Mode Selector Tabs */}
          <View
            className="flex-row p-1 rounded-xl mb-5"
            style={{ backgroundColor: colors.bgInput }}
          >
            <TouchableOpacity
              onPress={() => setScanningMode("barcode")}
              activeOpacity={0.8}
              className="flex-1 py-2.5 items-center rounded-xl flex-row justify-center"
              style={[
                scanningMode === "barcode" ? { backgroundColor: colors.bgCard } : undefined,
                scanningMode === "barcode"
                  ? {
                      shadowColor: colors.black,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  : undefined,
              ]}
            >
              <Package
                stroke={scanningMode === "barcode" ? colors.accent : colors.icon}
                size={16}
                className="mr-1.5"
              />
              <Text
                className="text-[12px] font-extrabold"
                style={{ color: scanningMode === "barcode" ? colors.accent : colors.textSecondary }}
              >
                Barcode Scan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setScanningMode("receipt")}
              activeOpacity={0.8}
              className="flex-1 py-2.5 items-center rounded-xl flex-row justify-center"
              style={[
                scanningMode === "receipt" ? { backgroundColor: colors.bgCard } : undefined,
                scanningMode === "receipt"
                  ? {
                      shadowColor: colors.black,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  : undefined,
              ]}
            >
              <FileText
                stroke={scanningMode === "receipt" ? colors.accent : colors.icon}
                size={16}
                className="mr-1.5"
              />
              <Text
                className="text-[12px] font-extrabold"
                style={{ color: scanningMode === "receipt" ? colors.accent : colors.textSecondary }}
              >
                Receipt OCR
              </Text>
            </TouchableOpacity>
          </View>

          {/* Camera Frame Simulation */}
          <View className="bg-slate-900 h-52 rounded-xl items-center justify-center relative overflow-hidden border-2 border-emerald-500/30 mb-5">
            <View className="absolute inset-0 items-center justify-center">
              <View className="h-36 w-64 border-2 border-dashed border-emerald-400/80 rounded-xl items-center justify-center bg-emerald-500/5">
                {isSimulatingScan ? (
                  <View className="items-center">
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text className="text-emerald-400 font-extrabold text-[12px] mt-2">
                      Decoding Barcode...
                    </Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <Scan stroke={colors.accent} size={36} strokeWidth={1.5} />
                    <Text className="text-slate-300 font-bold text-[12px] mt-2">
                      Align {scanningMode === "barcode" ? "Barcode" : "Receipt"} within frame
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Scanned Result Banner */}
          {scannedProduct ? (
            <Animated.View
              entering={FadeInDown.duration(250)}
              className="border p-4 rounded-xl mb-4"
              style={{ backgroundColor: colors.accentLightSubtle, borderColor: colors.border }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Sparkles stroke={colors.accentDark} size={18} className="mr-2" />
                  <Text className="text-[14px] font-black" style={{ color: colors.accent }}>
                    Product Found!
                  </Text>
                </View>
                <Text className="text-[13px] font-black" style={{ color: colors.accent }}>
                  ${scannedProduct.estimatedPrice?.toFixed(2)}
                </Text>
              </View>
              <Text
                className="text-[16px] font-extrabold mb-1"
                style={{ color: colors.textPrimary }}
              >
                {scannedProduct.name}
              </Text>
              <Text className="text-[12px] font-bold" style={{ color: colors.accent }}>
                {scannedProduct.category} • {scannedProduct.quantity} • {scannedProduct.priority}{" "}
                Priority
              </Text>

              <TouchableOpacity
                onPress={handleAddScannedItem}
                activeOpacity={0.8}
                className="mt-3 py-3 rounded-xl items-center flex-row justify-center shadow-green"
                style={{ backgroundColor: colors.accent }}
              >
                <Check stroke={colors.white} size={16} strokeWidth={3} className="mr-1.5" />
                <Text className="text-white font-extrabold text-[13px]">Add to Grocery List</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {/* Trigger Scan Simulation Button */}
          <TouchableOpacity
            onPress={handleSimulateScan}
            disabled={isSimulatingScan}
            activeOpacity={0.8}
            className="py-3.5 rounded-xl items-center flex-row justify-center mb-2"
            style={{ backgroundColor: colors.textPrimary }}
          >
            <Camera stroke={colors.bgCanvas} size={18} className="mr-2" />
            <Text className="font-extrabold text-[14px]" style={{ color: colors.bgCanvas }}>
              {isSimulatingScan ? "Scanning..." : "Tap to Scan Now"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};
