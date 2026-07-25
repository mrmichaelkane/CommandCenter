import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-neutral-50 text-neutral-900 hover:bg-neutral-200",
        secondary: "bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
        ghost: "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
        outline: "border border-neutral-700 text-neutral-100 hover:bg-neutral-800",
        danger: "bg-rose-600 text-white hover:bg-rose-500",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
