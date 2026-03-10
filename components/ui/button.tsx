import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "secondary" | "ghost";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  secondary:
    "bg-muted text-primary border border-border hover:bg-muted/70 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ghost:
    "bg-transparent text-foreground hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
