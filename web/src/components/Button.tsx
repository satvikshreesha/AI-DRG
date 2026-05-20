import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({
  variant = "outline",
  size = "md",
  style,
  children,
  ...rest
}: Props) {
  const padY = size === "sm" ? 6 : 8;
  const padX = size === "sm" ? 12 : 16;
  const fontSize = size === "sm" ? "var(--text-body-sm)" : "var(--text-body-sm)";

  const variants: Record<Variant, React.CSSProperties> = {
    primary: {
      background: "var(--color-graphite)",
      color: "var(--color-paper-white)",
      border: "1px solid var(--color-graphite)",
    },
    ghost: {
      background: "transparent",
      color: "var(--color-graphite)",
      border: "1px solid transparent",
    },
    outline: {
      background: "var(--color-paper-white)",
      color: "var(--color-graphite)",
      border: "1px solid var(--color-hairline)",
    },
    danger: {
      background: "var(--color-paper-white)",
      color: "#a14444",
      border: "1px solid #e2c1c1",
    },
  };

  return (
    <button
      {...rest}
      style={{
        ...variants[variant],
        padding: `${padY}px ${padX}px`,
        borderRadius: "var(--radius-pill)",
        fontSize,
        fontWeight: "var(--weight-regular)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "background var(--transition-fast), border-color var(--transition-fast)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (variant === "ghost") {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--color-parchment)";
        }
        if (variant === "outline") {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--color-parchment)";
        }
        rest.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (variant === "ghost") {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }
        if (variant === "outline") {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--color-paper-white)";
        }
        rest.onMouseLeave?.(e);
      }}
    >
      {children}
    </button>
  );
}
