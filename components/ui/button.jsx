import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#8B4A34] text-[#FFF8ED] hover:bg-[#7a3e2b]",
        secondary: "border border-[rgba(32,26,22,0.16)] bg-transparent text-[#201A16] hover:bg-[#FFF8ED]"
      },
      size: {
        default: "h-12 px-6",
        lg: "h-14 px-8"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
