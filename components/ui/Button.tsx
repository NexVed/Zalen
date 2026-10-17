import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { colors, radius, space } from "@/styles/tokens.stylex";

const styles = stylex.create({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingBlock: space.sm,
    paddingInline: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.2,
    cursor: "pointer",
    transitionProperty: "background-color, border-color, color",
    transitionDuration: "150ms",
  },
  primary: {
    backgroundColor: {
      default: colors.primary,
      ":hover": colors.primaryHover,
    },
    color: colors.primaryForeground,
  },
  secondary: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    color: colors.foreground,
  },
  danger: {
    backgroundColor: colors.primary,
    color: colors.primaryForeground,
  },
});

export type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  sx?: StyleXStyles;
};

export function Button({ variant = "primary", sx, ...props }: ButtonProps) {
  return (
    <button {...stylex.props(styles.base, styles[variant], sx)} {...props} />
  );
}
