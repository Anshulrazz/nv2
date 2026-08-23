"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, disabled, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn(
          "relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          type="checkbox"
          id={id}
          ref={ref}
          checked={checked}
          onChange={(e) => {
            if (onChange) onChange(e);
            if (onCheckedChange) onCheckedChange(e.target.checked);
          }}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded-md border border-[#2E2118] bg-[#150F0B] transition-all duration-200 flex items-center justify-center",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-[#F5B429] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0A0806]",
            "peer-checked:bg-[#F5B429] peer-checked:border-[#F5B429] peer-checked:text-[#150F0B]",
            "hover:border-[#F5B429]/50",
            className
          )}
        >
          {checked && <Check className="h-3.5 w-3.5 stroke-[3] text-[#150F0B]" />}
        </div>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
