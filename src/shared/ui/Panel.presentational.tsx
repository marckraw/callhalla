import type { HTMLAttributes } from "react";
import { cx } from "../lib/cx.pure";

type PanelProps = HTMLAttributes<HTMLDivElement>;

export const Panel = ({ className, ...props }: PanelProps) => {
  return (
    <div
      className={cx(
        "rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface),var(--background-soft))] p-4",
        className,
      )}
      {...props}
    />
  );
};
