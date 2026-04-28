import { formatDate } from "@/lib/pearls/format";
import type { Pearl } from "@/lib/pearls/types";

type PearlCardProps = {
  pearl: Pearl;
  isSelected: boolean;
  onSelect: () => void;
};

export function PearlCard({ pearl, isSelected, onSelect }: PearlCardProps) {
  return (
    <button
      className={`w-full rounded-3xl border p-5 text-left transition ${
        isSelected
          ? "border-stone-950 bg-stone-950 text-stone-50"
          : "border-stone-200 bg-white text-stone-950 hover:border-stone-400"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="mb-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.25em]">
        <span>{pearl.envelope.sourceType}</span>
        <span>{formatDate(pearl.envelope.encounterDate)}</span>
      </div>
      <h3 className="text-xl font-semibold leading-tight">
        {pearl.envelope.title || "Untitled Pearl"}
      </h3>
      <p
        className={`mt-3 line-clamp-3 text-sm leading-6 ${
          isSelected ? "text-stone-300" : "text-stone-600"
        }`}
      >
        {pearl.intellectualSynthesis || pearl.experientialRecord || pearl.envelope.mood}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {pearl.envelope.tags.slice(0, 4).map((tag) => (
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              isSelected ? "bg-stone-800" : "bg-stone-100"
            }`}
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
