import type * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full bg-[#edf3ef] px-2.5 py-1 text-xs font-semibold text-[#3d5849]", className)} {...props} />;
}
