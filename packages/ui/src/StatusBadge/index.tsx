import type { StatusBadgeProps } from "./types";

const toneClassNames: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "bg-surface-subtle text-muted",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export const StatusBadge = ({
  children,
  tone = "neutral",
}: StatusBadgeProps) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClassNames[tone]}`}
  >
    {children}
  </span>
);
