import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react-native";
import { PrimaryButton } from "./PrimaryButton";

import { useAppTheme } from "../../hooks";

type TStatusType = "success" | "error" | "warning" | "confirm";

interface IStatusModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: TStatusType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

/**
 * Elegant multi-purpose status modal
 * Why: To provide clear, beautiful feedback for user actions (success, errors, confirmations).
 * @param props - Component props including title, message, and modal type
 */
const StatusModal = ({
  visible,
  onClose,
  title,
  message,
  type = "success",
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onConfirm,
}: IStatusModalProps) => {
  const { colors } = useAppTheme();

  /**
   * Returns the appropriate icon based on the modal type
   */
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={48} stroke={colors.accent} strokeWidth={1.5} />;
      case "error":
        return <XCircle size={48} stroke={colors.danger} strokeWidth={1.5} />;
      case "warning":
        return <AlertTriangle size={48} stroke={colors.warning} strokeWidth={1.5} />;
      case "confirm":
        return <HelpCircle size={48} stroke={colors.info} strokeWidth={1.5} />;
    }
  };

  /**
   * Returns the background color for the icon container
   */
  const getIconBgColor = () => {
    switch (type) {
      case "success":
        return colors.accentLightSubtle;
      case "error":
        return colors.dangerLight;
      case "warning":
        return colors.warningLight;
      case "confirm":
        return colors.infoLight;
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View
        className="w-[85%] rounded-[32px] p-8 items-center shadow-2xl border"
        style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
      >
        <View
          className="h-24 w-24 rounded-[32px] items-center justify-center mb-6"
          style={{ backgroundColor: getIconBgColor() }}
        >
          {getIcon()}
        </View>

        <Text
          className="text-2xl font-bold text-center mb-2 tracking-tight"
          style={{ color: colors.textPrimary }}
        >
          {title}
        </Text>

        <Text
          className="text-[15px] leading-6 text-center mb-8 px-2"
          style={{ color: colors.textSecondary }}
        >
          {message}
        </Text>

        <View className="w-full gap-3">
          <PrimaryButton title={confirmLabel} onPress={onConfirm || onClose} />

          {type === "confirm" && (
            <TouchableOpacity onPress={onClose} className="py-3 items-center">
              <Text className="font-bold text-[15px]" style={{ color: colors.textMuted }}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 10000,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
  },
});

export default StatusModal;
