import * as React from "react";
import { cn } from "@/shared/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none",
        "placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export { Input };
