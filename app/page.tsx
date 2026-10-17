import * as stylex from "@stylexjs/stylex";
import { AuthButtons } from "@/components/AuthButtons";
import { colors, space } from "@/styles/tokens.stylex";

const styles = stylex.create({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBlock: space.md,
    paddingInline: space.lg,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.foreground,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: space.md,
  },
  main: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: space.lg,
    padding: space.xl,
    textAlign: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: colors.foreground,
  },
  subtitle: {
    maxWidth: 520,
    fontSize: 16,
    lineHeight: 1.6,
    color: colors.muted,
  },
});

export default function Home() {
  return (
    <>
      <header {...stylex.props(styles.header)}>
        <span {...stylex.props(styles.brand)}>Zalen</span>
        <div {...stylex.props(styles.actions)}>
          <AuthButtons />
        </div>
      </header>

      <main {...stylex.props(styles.main)}>
        <h1 {...stylex.props(styles.title)}>Zalen</h1>
        <p {...stylex.props(styles.subtitle)}>
          Next.js · Convex · Clerk · StyleX on the front end, with a Go Fiber
          API backing it.
        </p>
      </main>
    </>
  );
}
