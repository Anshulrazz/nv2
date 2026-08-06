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
            "h-4 w-4 shrink-0 rounded-md border border-white/20 bg-zinc-950/80 transition-all duration-200 flex items-center justify-center",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-zinc-950",
            "peer-checked:bg-cyan-500 peer-checked:border-cyan-400 peer-checked:text-black",
            "hover:border-cyan-500/50",
            className
          )}
        >
          {checked && <Check className="h-3.5 w-3.5 stroke-[3] text-black" />}
        </div>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
