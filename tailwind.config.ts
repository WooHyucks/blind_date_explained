import type { Config } from "tailwindcss";

const config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pinkBg: "#FFF5F5",
        pinkSoft: "#FFE8E8",
        coral: "#FF6B6B",
        coralSoft: "#FF9E9E",
        divider: "#FFD9D9",
        textDark: "#222222",
      },
      boxShadow: {
        roseSoft: "0 4px 6px -1px rgba(244, 63, 94, 0.12), 0 2px 4px -2px rgba(244, 63, 94, 0.08)",
      },
      borderRadius: {
        xl: "0.75rem",
        '2xl': "1rem",
      },
      fontFamily: {
        sans: [
          "'Noto Sans KR Variable'",
          "'Noto Sans KR'",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Ubuntu",
          "Cantarell",
          "'Noto Sans'",
          "'Helvetica Neue'",
          "Arial",
          "'Apple Color Emoji'",
          "'Segoe UI Emoji'",
        ],
      },
      maxWidth: {
        'screen-lg': '1024px',
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;


