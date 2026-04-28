import { sourceTypes, type PearlFilters as PearlFiltersType } from "@/lib/pearls/types";

type PearlFiltersProps = {
  filters: PearlFiltersType;
  tags: string[];
  onChange: (filters: PearlFiltersType) => void;
};

export function PearlFilters({ filters, tags, onChange }: PearlFiltersProps) {
  return (
    <div className="grid gap-3 rounded-3xl border border-stone-200 bg-white p-4 md:grid-cols-[1fr_180px_160px]">
      <input
        className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
        onChange={(event) =>
          onChange({ ...filters, query: event.currentTarget.value })
        }
        placeholder="Search titles, notes, tags..."
        value={filters.query ?? ""}
      />
      <select
        className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
        onChange={(event) =>
          onChange({
            ...filters,
            sourceType: event.currentTarget.value as PearlFiltersType["sourceType"],
          })
        }
        value={filters.sourceType ?? "all"}
      >
        <option value="all">All source types</option>
        {sourceTypes.map((sourceType) => (
          <option key={sourceType} value={sourceType}>
            {sourceType}
          </option>
        ))}
      </select>
      <select
        className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
        onChange={(event) =>
          onChange({ ...filters, tag: event.currentTarget.value })
        }
        value={filters.tag ?? ""}
      >
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>
    </div>
  );
}
