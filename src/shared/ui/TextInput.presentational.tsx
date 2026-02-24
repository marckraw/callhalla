import type { InputHTMLAttributes } from "react";
import { cx } from "../lib/cx.pure";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = ({ className, ...props }: TextInputProps) => {
  return (
    <input
      className={cx(
        "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none",
        "placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
};
