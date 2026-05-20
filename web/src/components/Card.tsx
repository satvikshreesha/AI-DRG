import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  padding?: number | string;
  style?: CSSProperties;
};

export function Card({ children, padding = 16, style }: Props) {
  return (
    <div
      style={{
        background: "var(--color-paper-white)",
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-card)",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
