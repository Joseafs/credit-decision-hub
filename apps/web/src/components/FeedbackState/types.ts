import type { ReactNode } from "react";

export type FeedbackStateProps = {
  action?: ReactNode;
  description?: string;
  title: string;
  tone?: "neutral" | "danger";
};
