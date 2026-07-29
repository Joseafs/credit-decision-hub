import type { ReactNode } from "react";

export type StatusBadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
};
