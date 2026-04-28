export const palette = {
  light: {
    mode: "light",
    background: "#ffffff",
    backgroundAlt: "#f7fbfc",
    surface: "#ffffff",
    surfaceMuted: "#f4f8fa",
    surfaceAccent: "#e8f7d8",
    text: "#173d32",
    textSoft: "#61717b",
    border: "#e6eef1",
    primary: "#58cc02",
    secondary: "#2493ee",
    danger: "#ff4b4b",
    warning: "#ff9600",
    shadow: "#103d2f",
  },
  dark: {
    mode: "dark",
    background: "#0f1417",
    backgroundAlt: "#131c21",
    surface: "#18242b",
    surfaceMuted: "#22313a",
    surfaceAccent: "#1d3623",
    text: "#f5f9fb",
    textSoft: "#a2b2ba",
    border: "#29414c",
    primary: "#78e526",
    secondary: "#67b7ff",
    danger: "#ff7a7a",
    warning: "#ffb14f",
    shadow: "#000000",
  },
} as const;

export type AppThemeName = keyof typeof palette;
export type AppTheme = (typeof palette)[AppThemeName];
