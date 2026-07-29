import type { ReactNode } from "react";

export type FeedbackStateProps = {
  action?: ReactNode;
  description?: ReactNode;
  title: string;
  tone?: "neutral" | "danger";
};
