import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export type SelectFieldOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

const emptyValue = "__shadcn_select_empty_value__";

type SelectFieldProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  required?: boolean;
};

export function SelectField({
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  "aria-label": ariaLabel,
  className,
  contentClassName,
  disabled,
  required,
}: SelectFieldProps) {
  return (
    <Select
      name={name}
      value={value === "" ? emptyValue : value}
      defaultValue={defaultValue === "" ? emptyValue : defaultValue}
      onValueChange={(nextValue) => onValueChange?.(nextValue === emptyValue ? "" : nextValue)}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value === "" ? emptyValue : option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
