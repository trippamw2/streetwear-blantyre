import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-[0.08em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3 sm:[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-gray-300 bg-transparent text-foreground hover:border-primary hover:bg-gray-50 hover:text-primary",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "text-foreground hover:bg-gray-100",
        link: "text-primary normal-case tracking-normal underline-offset-4 hover:underline",
        hero:
          "bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:bg-[#0b1f3d] hover:shadow-lg",
        whatsapp:
          "bg-[#1faa53] text-white shadow-md shadow-[#1faa53]/20 hover:bg-[#178f45]",
        outlineGlow:
          "border border-gray-200 bg-white text-foreground hover:border-primary hover:text-primary",
      },
      size: {
        default: "h-10 sm:h-11 px-4 sm:px-6 py-2 text-xs",
        sm: "h-9 px-4 text-[11px]",
        lg: "h-12 sm:h-14 px-6 sm:px-9 text-xs sm:text-sm",
        xl: "h-14 sm:h-16 px-8 sm:px-10 text-sm sm:text-base",
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
