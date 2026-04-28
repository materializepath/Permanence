import type React from "react";
import { formatDate } from "@/lib/pearls/format";
import type { Pearl } from "@/lib/pearls/types";

type PearlDetailProps = {
  pearl: Pearl;
  pearls: Pearl[];
  onEdit: () => void;
  onDelete: () => void;
};

export function PearlDetail({
  pearl,
  pearls,
  onEdit,
  onDelete,
}: PearlDetailProps) {
  const connectionTargets = new Map(
    pearls.map((candidate) => [candidate.id, candidate.envelope.title]),
  );

  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
            {pearl.envelope.sourceType} / {formatDate(pearl.envelope.encounterDate)}
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">
            {pearl.envelope.title || "Untitled Pearl"}
          </h2>
          <p className="mt-3 text-stone-600">{pearl.envelope.source}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
            onClick={onEdit}
            type="button"
          >
            Edit
          </button>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
            onClick={onDelete}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>

      <section className="grid gap-4 border-b border-stone-200 py-6 md:grid-cols-2">
        <Layer title="Mood">{pearl.envelope.mood}</Layer>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            Tags
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {pearl.envelope.tags.map((tag) => (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-sm" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-6 py-6">
        <Layer title="Experiential Record">{pearl.experientialRecord}</Layer>
        <Layer title="Intellectual Synthesis">{pearl.intellectualSynthesis}</Layer>
        <Layer title="Professor Transcript">
          {pearl.professorTranscript.length ? (
            <div className="space-y-3">
              {pearl.professorTranscript.map((message) => (
                <div
                  className="rounded-2xl bg-stone-50 p-4"
                  key={message.id}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    {message.role}
                  </p>
                  <p className="mt-2 leading-7 text-stone-700">{message.content}</p>
                </div>
              ))}
            </div>
          ) : (
            "No Professor session yet."
          )}
        </Layer>
        <Layer title="Connection Graph">
          {pearl.connections.length ? (
            <div className="space-y-3">
              {pearl.connections.map((connection) => (
                <div
                  className="rounded-2xl border border-stone-200 p-4"
                  key={connection.id}
                >
                  <p className="font-medium">
                    {connectionTargets.get(connection.targetPearlId) ??
                      "Missing Pearl"}
                  </p>
                  <p className="mt-2 leading-7 text-stone-600">{connection.note}</p>
                </div>
              ))}
            </div>
          ) : (
            "No explicit connections yet."
          )}
        </Layer>
      </div>
    </article>
  );
}

function Layer({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
        {title}
      </h3>
      <div className="mt-3 whitespace-pre-wrap leading-7 text-stone-700">
        {children || "Empty"}
      </div>
    </section>
  );
}
