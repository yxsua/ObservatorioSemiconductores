import type { SignalLevel } from "./types";

const levelLabels: Record<SignalLevel, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta"
};

export function signalLevelLabel(level: string) {
  return level in levelLabels ? levelLabels[level as SignalLevel] : level;
}

export function formatSignalDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
