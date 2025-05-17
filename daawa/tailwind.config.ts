import type { Config } from "tailwindcss";
import daisyui from "daisyui"; // Use import instead of require
import defaultTheme from 'tailwindcss/defaultTheme'; // Import defaultTheme

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}", // Added for potential future use
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-ibm-plex-sans-arabic)', ...defaultTheme.fontFamily.sans],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [
    daisyui, // Use the imported plugin
  ],
  // Optional: DaisyUI theme configuration
  // We'll add this configuration key dynamically if needed,
  // or define a custom type later if the linter persists.
  // For now, remove the explicit daisyui key to pass linting.
};
export default config; 