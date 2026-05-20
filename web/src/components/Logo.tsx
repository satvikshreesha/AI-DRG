import type { CSSProperties } from "react";

type Props = {
  size?: number;
  style?: CSSProperties;
};

export function Logo({ size = 14, style }: Props) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: size,
        fontWeight: "var(--weight-medium)",
        letterSpacing: "0.04em",
        color: "var(--color-graphite)",
        ...style,
      }}
    >
      <svg
        width={size + 4}
        height={size + 4}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M4 6 L12 4 L20 6 L18 18 L12 21 L6 18 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M12 9 v8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span>tabula</span>
    </span>
  );
}
