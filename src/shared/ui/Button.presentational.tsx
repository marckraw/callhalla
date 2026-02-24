import type { ButtonHTMLAttributes } from "react";
import { cx } from "../lib/cx.pure";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "default" | "primary" | "danger";
};

export const Button = ({ className, tone = "default", ...props }: ButtonProps) => {
  return (
    <button
      className={cx(
        "inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        tone === "default" && "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-strong)]",
        tone === "primary" && "border-[var(--accent)] bg-[var(--accent)] text-[#121212] hover:bg-[var(--accent-strong)]",
        tone === "danger" && "border-[var(--danger)] bg-[var(--danger)] text-white hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
};
