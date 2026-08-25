import type { Experience } from "@/data/experiences";

interface Props {
  experience: Experience;
  className?: string;
}

function peopleLabel(experience: Experience) {
  if (experience.minPeople === undefined) return experience.solo ? "ひとりでできる" : undefined;
  if (experience.maxPeople === experience.minPeople) return `${experience.minPeople}人`;
  if (experience.minPeople === 1) return "ひとりでできる";
  if (experience.minPeople === 2 && experience.maxPeople === undefined) return "誰かと楽しむ";
  if (experience.maxPeople === undefined) return `${experience.minPeople}人以上`;
  return `${experience.minPeople}〜${experience.maxPeople}人`;
}

export function ExperienceConditions({ experience, className = "" }: Props) {
  const location = experience.categoryCode === "outing" && experience.locationCode === "outing"
    ? undefined
    : experience.locationLabel || experience.place || undefined;
  const items = [
    { icon: "⏱", label: experience.durationLabel || experience.time || undefined },
    { icon: "💰", label: experience.budgetLabel || experience.cost || undefined },
    { icon: "📍", label: location },
    { icon: "👤", label: peopleLabel(experience) },
  ].filter((item): item is { icon: string; label: string } => Boolean(item.label));

  if (!items.length) return null;

  return <dl className={`flex flex-wrap gap-x-3 gap-y-1 ${className}`}>
    {items.map(({ icon, label }) => <div key={`${icon}-${label}`} className="flex items-center gap-1"><dt aria-hidden>{icon}</dt><dd>{label}</dd></div>)}
  </dl>;
}
