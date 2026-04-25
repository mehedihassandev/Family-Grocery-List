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
        <Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted dark:text-text-dark-muted">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center rounded-md border bg-surface-alt dark:bg-surface-dark-muted px-4 ${
          error 
            ? "border-danger" 
            : "border-border dark:border-border-dark"
        }`}
      >
        {icon ? icon : null}
        <TextInput
          {...props}
          placeholderTextColor={props.placeholderTextColor ?? "#C0C8D2"}
          className={`h-[52px] flex-1 text-[15px] font-medium text-text-900 dark:text-text-dark-primary ${icon ? "ml-3" : ""} ${inputClassName ?? ""}`}
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
