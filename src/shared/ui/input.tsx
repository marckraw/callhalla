import * as React from "react";
import { cn } from "@/shared/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none",
        "placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      data-slot="input"
      ref={ref}
      type={type}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export { Input };
