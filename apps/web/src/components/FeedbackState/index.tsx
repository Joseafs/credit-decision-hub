import type { FeedbackStateProps } from "./types";

export const FeedbackState = ({
  action,
  description,
  title,
  tone = "neutral",
}: FeedbackStateProps) => (
  <section
    className={[
      "rounded-2xl border p-8 text-center",
      tone === "danger"
        ? "border-danger/25 bg-danger-soft"
        : "border-border bg-surface",
    ].join(" ")}
    role={tone === "danger" ? "alert" : "status"}
  >
    <h2
      className={
        tone === "danger"
          ? "text-lg font-semibold text-danger"
          : "text-lg font-semibold text-heading"
      }
    >
      {title}
    </h2>
    {description && <p className="mt-2 text-sm text-muted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </section>
);
