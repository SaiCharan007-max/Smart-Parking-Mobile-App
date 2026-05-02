const darkPalette = {
  background: "#070d13",
  surface: "#0e1a25",
  surfaceMuted: "#102233",
  surfaceStrong: "#163248",
  border: "#1f3a50",
  text: "#f4f7fb",
  textMuted: "#b6c5d1",
  textSoft: "#8ea1b1",
  primary: "#7ce0b8",
  accent: "#f7b75d",
  danger: "#f08989",
  info: "#7cb4ff",
};

const lightPalette = {
  background: "#f6f9fd",
  surface: "#ffffff",
  surfaceMuted: "#f0f4fa",
  surfaceStrong: "#e7eef7",
  border: "#d3deeb",
  text: "#0d1b2a",
  textMuted: "#4b5b6c",
  textSoft: "#6a7a8d",
  primary: "#2f8f83",
  accent: "#e09b3c",
  danger: "#d44343",
  info: "#3972d2",
};

const buildTheme = (palette) => ({
  colors: palette,
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 20,
    gap: 18,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  heroCard: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
  },
  heading: {
    color: palette.text,
    fontFamily: "Orbitron-Regular",
  },
  shadow: {
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});

export const themes = {
  dark: buildTheme(darkPalette),
  light: buildTheme(lightPalette),
};

// Default export to keep existing imports working.
export const theme = themes.dark;

export const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `INR ${amount.toFixed(2)}`;
};

export const calculateDurationMinutes = (entryTime, now = new Date()) => {
  if (!entryTime) {
    return 0;
  }

  const start = new Date(entryTime);
  const end = new Date(now);
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  return Math.max(1, Math.ceil(diffMs / (1000 * 60)));
};

export const calculateEstimatedAmount = (entryTime, ratePerHour, now = new Date()) => {
  const durationMinutes = calculateDurationMinutes(entryTime, now);
  const rate = Number(ratePerHour || 0);
  return Number(((durationMinutes / 60) * rate).toFixed(2));
};

export const formatDurationLabel = (minutes) => {
  const totalMinutes = Number(minutes || 0);
  if (!totalMinutes) {
    return "0 min";
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (!hours) {
    return `${remainingMinutes} min`;
  }

  if (!remainingMinutes) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
};

export const getStatusTone = (status, palette = darkPalette) => {
  switch (status) {
    case "active":
      return { backgroundColor: palette.surfaceMuted, color: palette.text };
    case "completed":
      return { backgroundColor: palette.surfaceStrong, color: palette.textMuted };
    case "paid":
      return { backgroundColor: palette.primary, color: "#062017" };
    case "pending":
      return { backgroundColor: palette.accent, color: "#231403" };
    default:
      return { backgroundColor: palette.border, color: palette.textSoft };
  }
};
