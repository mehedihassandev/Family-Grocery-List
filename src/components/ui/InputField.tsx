import React, { ReactNode } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

type InputFieldProps = TextInputProps & {
  label?: string;
  icon?: ReactNode;
  containerClassName?: string;
  inputClassName?: string;
};

const InputField = ({
  label,
  icon,
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

      <View className="flex-row items-center rounded-2xl border border-border bg-surface-muted px-4">
        {icon ? icon : null}
        <TextInput
          {...props}
          placeholderTextColor={props.placeholderTextColor ?? "#95a39a"}
          className={`ml-3 h-12 flex-1 text-base font-medium text-text-primary ${inputClassName ?? ""}`}
        />
      </View>
    </View>
  );
};

export default InputField;
