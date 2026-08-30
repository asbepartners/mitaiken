import type { Timing } from "@/lib/timing";

function formatTimelineTiming(timing: Timing): string {
  if (!timing.value || timing.type === "unknown") return "もっと\n以前";
  const [year, month, day] = timing.value.split("-");
  if (timing.type === "date" && month && day) return `${year}\n${Number(month)}.${Number(day)}`;
  if (timing.type === "month" && month) return `${year}\n${Number(month)}月`;
  return year;
}

export function TimelineDate({ timing, first, last }: { timing: Timing; first: boolean; last: boolean }) {
  return (
    <div className="relative flex w-14 shrink-0 items-start justify-center pt-3 text-center">
      {!first && <span className="absolute left-1/2 top-0 h-7 w-0.5 -translate-x-1/2 bg-coral-400/70" aria-hidden="true" />}
      {!last && <span className="absolute -bottom-2.5 left-1/2 top-7 w-0.5 -translate-x-1/2 bg-coral-400/70" aria-hidden="true" />}
      <p className="relative z-10 whitespace-pre-line rounded-md bg-ivory px-1.5 py-1 text-[11px] font-bold leading-tight text-green-950">
        {formatTimelineTiming(timing)}
      </p>
    </div>
  );
}
