import React, { ReactNode } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

export type InputFieldProps = TextInputProps & {
  label?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
};

const InputField = ({
  label,
  icon,
  rightIcon,
  error,
  containerClassName,
  inputClassName,
  ...props
}: InputFieldProps) => {
  return (
    <View className={`w-full ${containerClassName ?? ""}`}>
      {label ? (
        <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-[2px] text-text-muted">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center rounded-2xl border bg-surface-muted px-4 ${
          error ? "border-[#c36262]" : "border-border"
        }`}
      >
        {icon ? icon : null}
        <TextInput
          {...props}
          placeholderTextColor={props.placeholderTextColor ?? "#95a39a"}
          className={`ml-3 h-12 flex-1 text-base font-medium text-text-primary ${inputClassName ?? ""}`}
        />
        {rightIcon ? rightIcon : null}
      </View>

      {error ? (
        <Text className="mt-1.5 ml-1 text-xs text-[#c36262]">{error}</Text>
      ) : null}
    </View>
  );
};

export default InputField;
