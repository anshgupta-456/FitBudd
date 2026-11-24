import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const color = (name: string) => `hsl(var(--${name}) / <alpha-value>)`

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem" },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        background: color("background"),
        foreground: color("foreground"),
        surface: { DEFAULT: color("surface"), 2: color("surface-2") },
        muted: { DEFAULT: color("muted"), foreground: color("muted-foreground") },
        border: { DEFAULT: color("border"), strong: color("border-strong") },
        input: color("input"),
        ring: color("ring"),
        primary: { DEFAULT: color("primary"), foreground: color("primary-foreground") },
        brand: color("brand"),
        success: { DEFAULT: color("success"), soft: color("success-soft") },
        warning: { DEFAULT: color("warning"), soft: color("warning-soft") },
        danger: { DEFAULT: color("danger"), soft: color("danger-soft") },
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "calc(var(--radius) - 2px)",
        md: "var(--radius)",
        lg: "calc(var(--radius) + 2px)",
      },
      fontSize: {
        "2xs": ["11px", "14px"],
      },
      keyframes: {
        "slide-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "slide-in-left": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
      },
    },
  },
  plugins: [animate],
}

export default config
