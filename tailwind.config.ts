import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Kasafide tokens. Values live in public/assets/css/kasafide-theme.css (light and dark);
        // these only point at them, so a colour is never spelled in two places.
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-soft": "var(--surface-soft)",
        border: "var(--border)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        primary: "var(--primary)",
        "on-primary": "var(--on-primary)",
        accent: "var(--accent)",
        "on-accent": "var(--on-accent)",
        "heading-accent": "var(--heading-accent)",
        "focus-ring": "var(--focus-ring)",
        "map-stroke": "var(--map-stroke)",
        "map-fill": "var(--map-fill)",
        "map-label": "var(--map-label)",
      },
    },
  },
  plugins: [],
};
export default config;
