import type { TextareaHTMLAttributes } from "react";
import { cx } from "../lib/cx.pure";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = ({ className, ...props }: TextAreaProps) => {
  return (
    <textarea
      className={cx(
        "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none",
        "placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
};
