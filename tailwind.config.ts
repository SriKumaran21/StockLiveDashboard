import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
        xl: "1rem",
      },
      colors: {
        background: "hsl(220 10% 8%)", // Dark charcoal
        foreground: "hsl(210 20% 98%)", // Off-white
        
        card: "hsl(220 10% 12%)", // Slightly lighter charcoal for cards
        cardForeground: "hsl(210 20% 98%)",
        
        popover: "hsl(220 10% 12%)",
        popoverForeground: "hsl(210 20% 98%)",
        
        primary: "hsl(150 80% 40%)", // Vibrant green
        primaryForeground: "hsl(210 20% 98%)",
        
        secondary: "hsl(220 10% 20%)", // Darker grey for secondary elements
        secondaryForeground: "hsl(210 20% 98%)",
        
        muted: "hsl(210 10% 60%)", // Light grey for muted text
        mutedForeground: "hsl(210 10% 60%)",
        
        accent: "hsl(150 80% 40%)", // Vibrant green
        accentForeground: "hsl(210 20% 98%)",
        
        destructive: "hsl(0 84% 60%)", // Red for destructive actions
        destructiveForeground: "hsl(210 20% 98%)",
        
        border: "hsl(220 10% 25%)", // Slightly lighter grey for borders
        input: "hsl(220 10% 20%)",
        ring: "hsl(150 80% 40%)",
        
        // Financial colors
        bull: "hsl(150 80% 40%)", // Vibrant green
        bear: "hsl(0 84% 60%)", // Red
        
        // Additional fintech colors
        profit: "hsl(150 80% 40%)", // Vibrant green
        loss: "hsl(0 84% 60%)", // Red
        neutral: "hsl(210 10% 60%)", // Light grey
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      keyframes: {
        "glow": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.5)" },
          "100%": { boxShadow: "0 0 20px 2px hsl(var(--primary) / 0.3)" }
        },
        "glow-green": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--profit) / 0.5)" },
          "100%": { boxShadow: "0 0 20px 2px hsl(var(--profit) / 0.3)" }
        },
        "glow-red": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--loss) / 0.5)" },
          "100%": { boxShadow: "0 0 20px 2px hsl(var(--loss) / 0.3)" }
        },
        "lift": {
          "0%": { transform: "translateY(0px)" },
          "100%": { transform: "translateY(-2px)" }
        }
      },
      animation: {
        "glow": "glow 2s ease-in-out infinite",
        "glow-green": "glow-green 2s ease-in-out infinite",
        "glow-red": "glow-red 2s ease-in-out infinite",
        "lift": "lift 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        "glow": "0 0 20px 2px hsl(var(--primary) / 0.3)",
        "glow-green": "0 0 20px 2px hsl(var(--profit) / 0.3)",
        "glow-red": "0 0 20px 2px hsl(var(--loss) / 0.3)",
        "card": "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        "button": "0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)",
      }
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
