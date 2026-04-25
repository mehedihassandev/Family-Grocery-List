import React from "react";
import {
  useController,
  Control,
  FieldValues,
  Path,
  UseControllerProps,
} from "react-hook-form";
import InputField, { IInputFieldProps } from "./InputField";

export interface IRhfTextfieldProps<T extends FieldValues>
  extends Omit<IInputFieldProps, "value"> {
  name: Path<T>;
  control: Control<T>;
  rules?: UseControllerProps<T, Path<T>>["rules"];
  transform?: (text: string) => string;
}

/**
 * React Hook Form wrapper for InputField
 * Why: To provide a declarative way to bind form state to our custom input components.
 * @param props - Component props including form control, name, and optional transformation rules
 */
export function RhfTextfield<T extends FieldValues>({
  name,
  control,
  rules,
  transform,
  onChangeText,
  ...inputProps
}: IRhfTextfieldProps<T>) {
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
