import React from "react";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

interface ISecondaryButtonProps extends TouchableOpacityProps {
  title: string;
}

/**
 * Secondary action button for less prominent tasks
 * Why: To provide a consistent, visually subtle button component for secondary actions.
 * @param props - Component props including title and standard touchable attributes
 */
const SecondaryButton = ({ title, className, ...props }: ISecondaryButtonProps) => {
  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.8}
      className={`w-full flex-row items-center justify-center rounded-2xl h-[52px] border border-border bg-surface px-6 ${className ?? ""}`}
    >
      <Text className="text-[15px] font-bold text-text-secondary">{title}</Text>
    </TouchableOpacity>
  );
};

export default SecondaryButton;
