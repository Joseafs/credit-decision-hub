import type { ButtonProps } from "./types";

const variantClassNames: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary:
    "border border-border bg-surface text-heading hover:border-primary",
  danger: "bg-danger text-white hover:brightness-95",
};

export const Button = ({
  className,
  fullWidth = false,
  type = "button",
  variant = "primary",
  ...buttonProps
}: ButtonProps) => (
  <button
    className={[
      "inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
      variantClassNames[variant],
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    type={type}
    {...buttonProps}
  />
);
