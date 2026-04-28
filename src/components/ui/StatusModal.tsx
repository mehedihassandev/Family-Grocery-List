import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react-native";
import { PrimaryButton } from "./PrimaryButton";

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
  /**
   * Returns the appropriate icon based on the modal type
   */
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={48} stroke="#3DB87A" strokeWidth={1.5} />;
      case "error":
        return <XCircle size={48} stroke="#E55C5C" strokeWidth={1.5} />;
      case "warning":
        return <AlertTriangle size={48} stroke="#F5A623" strokeWidth={1.5} />;
      case "confirm":
        return <HelpCircle size={48} stroke="#4A90D9" strokeWidth={1.5} />;
    }
  };

  /**
   * Returns the background color class for the icon container
   */
  const getIconBg = () => {
    switch (type) {
      case "success":
        return "bg-primary-50";
      case "error":
        return "bg-danger-light";
      case "warning":
        return "bg-warning-light";
      case "confirm":
        return "bg-info-light";
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View className="w-[85%] rounded-[32px] bg-white p-8 items-center shadow-2xl">
        <View
          className={`h-24 w-24 rounded-[32px] items-center justify-center mb-6 ${getIconBg()}`}
        >
          {getIcon()}
        </View>

        <Text className="text-2xl font-bold text-text-primary text-center mb-2 tracking-tight">
          {title}
        </Text>

        <Text className="text-[15px] leading-6 text-text-secondary text-center mb-8 px-2">
          {message}
        </Text>

        <View className="w-full gap-3">
          <PrimaryButton title={confirmLabel} onPress={onConfirm || onClose} />

          {type === "confirm" && (
            <TouchableOpacity onPress={onClose} className="py-3 items-center">
              <Text className="text-text-muted font-bold text-[15px]">{cancelLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 10000,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
  },
});

export default StatusModal;
