## Packages
recharts | Interactive financial price charts
date-fns | Date formatting and manipulation
framer-motion | Page transitions and UI animations
clsx | Class merging utility
tailwind-merge | Tailwind class merging

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
  mono: ["var(--font-mono)"],
}
WebSocket connects to /ws path for live price and index updates.
