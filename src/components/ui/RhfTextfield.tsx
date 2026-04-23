import React from "react";
import {
  useController,
  Control,
  FieldValues,
  Path,
  UseControllerProps,
} from "react-hook-form";
import InputField, { InputFieldProps } from "./InputField";

export interface RhfTextfieldProps<T extends FieldValues>
  extends Omit<InputFieldProps, "value"> {
  name: Path<T>;
  control: Control<T>;
  rules?: UseControllerProps<T, Path<T>>["rules"];
  transform?: (text: string) => string;
}

export function RhfTextfield<T extends FieldValues>({
  name,
  control,
  rules,
  transform,
  onChangeText,
  ...inputProps
}: RhfTextfieldProps<T>) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({ name, control, rules });

  return (
    <InputField
      {...inputProps}
      value={value}
      onChangeText={(text) => {
        const newText = transform ? transform(text) : text;
        onChange(newText);
        if (onChangeText) {
          onChangeText(newText);
        }
      }}
      onBlur={onBlur}
      error={error?.message}
    />
  );
}
