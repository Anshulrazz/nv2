import React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:brightness-105 shadow-sm active:scale-[0.98]",
        primary:
          "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:brightness-105 shadow-sm active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-muted hover:border-primary/40 active:scale-[0.98]",
        outline:
          "border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]",
        ghost:
          "bg-transparent hover:bg-muted hover:text-foreground text-muted-foreground active:scale-[0.98]",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 focus-visible:ring-destructive/30 active:scale-[0.98]",
        "premium-primary":
          "btn-premium-primary text-[#0A0806]",
        "premium-secondary":
          "btn-premium-secondary",
      },
      size: {
        default: "h-10 py-2 px-4 text-sm rounded-xl",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-11 px-6 text-sm font-semibold rounded-xl",
        icon: "size-9 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        pill: "h-10 py-2 px-5 text-sm rounded-full",
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

export { buttonVariants }
