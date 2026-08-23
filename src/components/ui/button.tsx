import React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#F7C948] to-[#F5941D] text-[#150F0B] font-semibold hover:brightness-105 shadow-[0_4px_20px_-2px_rgba(245,148,29,0.35)] active:translate-y-0",
        outline:
          "border-[#2E2118] bg-[#150F0B] text-[#FAFAF8] hover:bg-[#241811] hover:border-[#F5B429]/40 hover:text-[#FAFAF8]",
        secondary:
          "bg-[#241811] text-[#FAFAF8] border border-[#2E2118] hover:bg-[#2E2118] hover:text-[#FAFAF8]",
        ghost:
          "hover:bg-[#241811] hover:text-[#FAFAF8] text-[#B8AFA6]",
        destructive:
          "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/25 focus-visible:ring-[#EF4444]/30",
        "premium-primary": "btn-premium-primary",
        "premium-secondary": "btn-premium-secondary",
      },
      size: {
        default: "h-10 py-2 px-5",
        sm: "h-8 px-3.5 text-xs rounded-full",
        lg: "h-11 px-8 text-base rounded-full font-semibold",
        icon: "h-9 w-9 rounded-full",
      },
      asChild: {
        false: "inline-flex",
        true: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonVariantProps extends VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

interface ButtonProps extends React.ComponentPropsWithoutRef<typeof ButtonPrimitive> {
  variant?: ButtonVariantProps["variant"]
  size?: ButtonVariantProps["size"]
  asChild?: ButtonVariantProps["asChild"]
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Component = asChild ? "span" : ButtonPrimitive
  return (
    <Component
      ref={ref}
      className={cn(
        buttonVariants({ variant, size, asChild }),
        className
      )}
      {...props}
    />
  )
})
Button.displayName = ButtonPrimitive.displayName
