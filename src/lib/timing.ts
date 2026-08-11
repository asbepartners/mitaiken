export type TimingType = "date" | "month" | "year" | "unknown";

export interface Timing {
  type: TimingType;
  value: string | null;
}

export const UNKNOWN_TIMING: Timing = { type: "unknown", value: null };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function todayTiming(): Timing {
  const now = new Date();
  return {
    type: "date",
    value: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
  };
}

export function isValidTiming(value: unknown): value is Timing {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const validTypes: TimingType[] = ["date", "month", "year", "unknown"];
  if (!validTypes.includes(candidate.type as TimingType)) return false;
  if (candidate.value !== null && typeof candidate.value !== "string") return false;
  return true;
}

export function formatTiming(timing: Timing | undefined | null): string {
  if (!timing || timing.type === "unknown" || !timing.value) {
    return "もっと以前";
  }

  const [yearStr, monthStr, dayStr] = timing.value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (timing.type === "date" && year && month && day) {
    return `${year}年${month}月${day}日`;
  }
  if (timing.type === "month" && year && month) {
    return `${year}年${month}月`;
  }
  if (timing.type === "year" && year) {
    return `${year}年`;
  }
  return "もっと以前";
}
