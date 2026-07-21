import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-full text-xs sm:text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3 sm:[&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent hover:bg-secondary hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-button hover:shadow-glow hover:scale-[1.03] font-bold",
        whatsapp: "bg-[hsl(142_70%_45%)] text-white hover:bg-[hsl(142_70%_40%)] shadow-button font-bold",
        outlineGlow: "border border-border bg-card/40 backdrop-blur hover:border-primary hover:bg-card text-foreground",
      },
      size: {
        default: "h-10 sm:h-11 px-4 sm:px-6 py-2 text-sm",
        sm: "h-8 sm:h-9 px-3 sm:px-4 text-xs",
        lg: "h-12 sm:h-14 px-6 sm:px-9 text-base",
        xl: "h-14 sm:h-16 px-8 sm:px-10 text-lg",
        icon: "h-10 w-10 sm:h-11 sm:w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
