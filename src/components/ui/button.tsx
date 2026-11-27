import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 sm:[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#0b1f3d]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-gray-300 bg-transparent text-foreground hover:border-[#141414] hover:bg-[#141414] hover:text-white",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "text-foreground hover:bg-gray-100",
        link: "text-primary normal-case tracking-normal underline-offset-4 hover:underline",
        hero:
          "bg-[#141414] text-white hover:bg-primary",
        whatsapp:
          "bg-[#1faa53] text-white hover:bg-[#178f45]",
        outlineGlow:
          "border border-gray-200 bg-white text-foreground hover:border-primary hover:text-primary",
      },
      size: {
        default: "h-11 sm:h-12 px-5 sm:px-7 py-2 text-[11px] sm:text-xs",
        sm: "h-9 px-4 text-[10px] sm:text-[11px]",
        lg: "h-12 sm:h-14 px-7 sm:px-10 text-[11px] sm:text-xs",
        xl: "h-14 sm:h-16 px-8 sm:px-12 text-xs sm:text-sm",
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
