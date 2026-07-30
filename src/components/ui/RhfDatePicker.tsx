import React from "react";
import { useController, Control, FieldValues, Path, UseControllerProps } from "react-hook-form";
import DatePicker, { IDatePickerProps } from "./DatePicker";

export interface IRhfDatePickerProps<T extends FieldValues> extends Omit<
  IDatePickerProps,
  "value" | "onChange"
> {
  name: Path<T>;
  control: Control<T>;
  rules?: UseControllerProps<T, Path<T>>["rules"];
  onChangeDate?: (dateString: string) => void;
}

/**
 * React Hook Form wrapper for DatePicker
 * @param props - Component props including form control, name, and validation rules
 */
export function RhfDatePicker<T extends FieldValues>({
  name,
  control,
  rules,
  onChangeDate,
  ...datePickerProps
}: IRhfDatePickerProps<T>) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ name, control, rules });

  return (
    <DatePicker
      {...datePickerProps}
      value={value}
      onChange={(dateStr) => {
        onChange(dateStr);
        if (onChangeDate) {
          onChangeDate(dateStr);
        }
      }}
      error={error?.message}
    />
  );
}

export default RhfDatePicker;
