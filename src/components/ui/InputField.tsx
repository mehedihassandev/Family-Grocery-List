import React, { ReactNode } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { useColorScheme } from "nativewind";

export type InputFieldProps = TextInputProps & {
  label?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
};

/**
 * Standard text input field with label and error support
 * Why: To provide a consistent, theme-aware input experience across all forms.
 */
const InputField = ({
  label,
  icon,
  rightIcon,
  error,
  containerClassName,
  inputClassName,
  ...props
}: InputFieldProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className={`w-full ${containerClassName ?? ""}`}>
      {label ? (
        <Text className="mb-2 ml-1 text-[10px] font-bold uppercase tracking-[2px] text-text-muted dark:text-text-dark-muted">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center rounded-2xl border bg-surface-muted dark:bg-surface-dark-muted px-4 ${
          error 
            ? "border-urgent" 
            : "border-border dark:border-border-dark"
        }`}
      >
        {icon ? icon : null}
        <TextInput
          {...props}
          placeholderTextColor={props.placeholderTextColor ?? (isDark ? "#4f5f56" : "#95a39a")}
          className={`ml-3 h-12 flex-1 text-[16px] font-medium text-text-primary dark:text-text-dark-primary ${inputClassName ?? ""}`}
        />
        {rightIcon ? rightIcon : null}
      </View>

      {error ? (
        <Text className="mt-1.5 ml-1 text-[12px] font-medium text-urgent">{error}</Text>
      ) : null}
    </View>
  );
};

export default InputField;
