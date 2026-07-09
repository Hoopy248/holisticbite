import * as React from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[rgba(32,26,22,0.12)] bg-[#FFF8ED] text-[#201A16] shadow-[0_24px_80px_rgba(32,26,22,0.10)]",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}
