import React, { ReactNode } from "react";
import { Text, TextInput, TextInputProps, View, StyleSheet } from "react-native";
import { useAppTheme } from "../../hooks";

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
 * Features dynamic theme colors for border, background, label, and input text.
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
  const { colors } = useAppTheme();

  return (
    <View className={`w-full ${containerClassName ?? ""}`}>
      {label ? (
        <Text
          className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ color: colors.textMuted }}
        >
          {label}
        </Text>
      ) : null}

      <View
        className="flex-row items-center rounded-xl border px-4"
        style={{
          backgroundColor: error ? colors.dangerLight : colors.bgInput,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: 16,
        }}
      >
        {icon ? icon : null}
        <TextInput
          {...props}
          className={`flex-1 text-[15px] font-medium ${inputClassName ?? ""}`}
          placeholderTextColor={props.placeholderTextColor ?? colors.iconMuted}
          style={[
            styles.input,
            icon ? { marginLeft: 10 } : null,
            { color: colors.textPrimary },
            style,
          ]}
        />
        {rightIcon ? rightIcon : null}
      </View>

      {error ? (
        <Text className="mt-1.5 ml-1 text-[12px] font-bold" style={{ color: colors.danger }}>
          {error}
        </Text>
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
    paddingVertical: 0,
    textAlignVertical: "center",
  },
});

export default InputField;
