"use client";

interface Props {
  years: string[];
  value: string;
  onChange: (year: string) => void;
  className?: string;
}

const buttonClass = (active: boolean) => `shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? "border-coral-400 bg-coral-400 text-paper shadow-sm" : "border-green-100 bg-paper text-green-800"}`;

export function HajimeteYearFilter({ years, value, onChange, className = "" }: Props) {
  const currentYear = String(new Date().getFullYear());
  const previousYear = String(Number(currentYear) - 1);
  const otherYears = years.filter((year) => year !== currentYear && year !== previousYear);
  const selectedOtherYear = otherYears.includes(value) ? value : "";

  return <div className={`flex flex-wrap gap-2 ${className}`}>
    <button type="button" onClick={() => onChange("all")} className={buttonClass(value === "all")}>すべて</button>
    <button type="button" onClick={() => onChange(currentYear)} className={buttonClass(value === currentYear)}>今年</button>
    <button type="button" onClick={() => onChange(previousYear)} className={buttonClass(value === previousYear)}>去年</button>
    <select value={selectedOtherYear} disabled={otherYears.length === 0} onChange={(event) => event.target.value && onChange(event.target.value)} aria-label="年を選ぶ" className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium outline-none ${selectedOtherYear ? "border-coral-400 bg-coral-400 text-paper shadow-sm" : "border-green-100 bg-paper text-green-800 disabled:opacity-40"}`}>
      <option value="">年を選ぶ</option>
      {otherYears.map((year) => <option key={year} value={year}>{year}年</option>)}
    </select>
  </div>;
}
