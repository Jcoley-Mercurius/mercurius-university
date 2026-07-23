import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:pointer-events-none disabled:opacity-50",
  { variants: { variant: {
    default: "bg-[#164f3b] text-white shadow-sm hover:bg-[#103c2d]",
    outline: "border bg-white text-[#24362d] hover:bg-[#f4f7f5]",
    ghost: "text-[#43564b] hover:bg-[#edf2ef]",
  } }, defaultVariants: { variant: "default" } },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export function Button({ className, variant, asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant }), className)} {...props} />;
}
