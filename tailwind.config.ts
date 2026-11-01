import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "oklch(var(--ink))", paper: "oklch(var(--paper))", action: "oklch(var(--action))" } } },
  plugins: []
} satisfies Config;
