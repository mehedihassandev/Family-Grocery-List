import React, { ReactNode } from "react";
import { Text, TextInput, TextInputProps, View, StyleSheet } from "react-native";

export interface IInputFieldProps extends TextInputProps {
  label?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
}

/**
 * Standard text input field with label and error support
 * Why: To provide a consistent, theme-aware input experience across all forms.
 * @param props - Component props including label, icon, and text input attributes
 */
const InputField = ({
  label,
  icon,
  rightIcon,
  error,
  containerClassName,
  inputClassName,
  style,
  ...props
}: IInputFieldProps) => {
  return (
    <View className={`w-full ${containerClassName ?? ""}`}>
      {label ? (
        <Text className="mb-2 ml-1 text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center rounded-2xl border bg-surface-alt px-4 ${
          error ? "border-danger bg-danger-light/30" : "border-border"
        }`}
      >
        {icon ? icon : null}
        <TextInput
          {...props}
          className={inputClassName}
          placeholderTextColor={props.placeholderTextColor ?? "#94A3B8"}
          style={[styles.input, icon ? { marginLeft: 10 } : null, style]}
        />
        {rightIcon ? rightIcon : null}
      </View>

      {error ? (
        <Text className="mt-1.5 ml-1 text-[12px] font-bold text-danger-dark">{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 52,
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#0F172A",
  },
});

export default InputField;
