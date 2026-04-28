import type React from "react";
import { createId } from "@/lib/pearls/store";
import { parseTags } from "@/lib/pearls/format";
import {
  sourceTypes,
  type Pearl,
  type PearlConnection,
  type PearlDraft,
  type SourceType,
} from "@/lib/pearls/types";

type PearlFormProps = {
  draft: PearlDraft;
  pearls: Pearl[];
  currentPearlId?: string;
  onChange: (draft: PearlDraft) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function PearlForm({
  draft,
  pearls,
  currentPearlId,
  onChange,
  onCancel,
  onSave,
}: PearlFormProps) {
  const availablePearls = pearls.filter((pearl) => pearl.id !== currentPearlId);

  function updateDraft(partial: Partial<PearlDraft>) {
    onChange({ ...draft, ...partial });
  }

  function updateEnvelope(
    partial: Partial<PearlDraft["envelope"]>,
  ) {
    updateDraft({ envelope: { ...draft.envelope, ...partial } });
  }

  function addConnection() {
    const targetPearlId = availablePearls[0]?.id;

    if (!targetPearlId) {
      return;
    }

    updateDraft({
      connections: [
        ...draft.connections,
        {
          id: createId("connection"),
          targetPearlId,
          note: "",
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }

  function updateConnection(id: string, partial: Partial<PearlConnection>) {
    updateDraft({
      connections: draft.connections.map((connection) =>
        connection.id === id ? { ...connection, ...partial } : connection,
      ),
    });
  }

  function removeConnection(id: string) {
    updateDraft({
      connections: draft.connections.filter((connection) => connection.id !== id),
    });
  }

  return (
    <form
      className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
            Pearl Editor
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Shape the encounter
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
            type="submit"
          >
            Save Pearl
          </button>
        </div>
      </div>

      <div className="grid gap-4 py-6 md:grid-cols-2">
        <Field label="Title">
          <input
            className="input"
            onChange={(event) => updateEnvelope({ title: event.currentTarget.value })}
            placeholder="Duchamp Readymades at MoMA"
            required
            value={draft.envelope.title}
          />
        </Field>
        <Field label="Source URL or location">
          <input
            className="input"
            onChange={(event) => updateEnvelope({ source: event.currentTarget.value })}
            placeholder="Museum, book, URL, screening..."
            value={draft.envelope.source}
          />
        </Field>
        <Field label="Source type">
          <select
            className="input"
            onChange={(event) =>
              updateEnvelope({ sourceType: event.currentTarget.value as SourceType })
            }
            value={draft.envelope.sourceType}
          >
            {sourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {sourceType}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date of encounter">
          <input
            className="input"
            onChange={(event) =>
              updateEnvelope({ encounterDate: event.currentTarget.value })
            }
            type="date"
            value={draft.envelope.encounterDate}
          />
        </Field>
        <Field label="Tags">
          <input
            className="input"
            onChange={(event) =>
              updateEnvelope({ tags: parseTags(event.currentTarget.value) })
            }
            placeholder="authorship, memory, cinema"
            value={draft.envelope.tags.join(", ")}
          />
        </Field>
        <Field label="Mood">
          <textarea
            className="input min-h-28"
            onChange={(event) => updateEnvelope({ mood: event.currentTarget.value })}
            placeholder="What was your headspace?"
            value={draft.envelope.mood}
          />
        </Field>
      </div>

      <div className="space-y-5">
        <Field label="Experiential Record">
          <textarea
            className="input min-h-44"
            onChange={(event) =>
              updateDraft({ experientialRecord: event.currentTarget.value })
            }
            placeholder="What did it feel like to encounter this?"
            value={draft.experientialRecord}
          />
        </Field>
        <Field label="Intellectual Synthesis">
          <textarea
            className="input min-h-44"
            onChange={(event) =>
              updateDraft({ intellectualSynthesis: event.currentTarget.value })
            }
            placeholder="What did you learn, connect, or want to make?"
            value={draft.intellectualSynthesis}
          />
        </Field>
        <section>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              Connections
            </h3>
            <button
              className="rounded-full border border-stone-300 px-3 py-1 text-sm"
              disabled={!availablePearls.length}
              onClick={addConnection}
              type="button"
            >
              Add connection
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {draft.connections.map((connection) => (
              <div
                className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 md:grid-cols-[220px_1fr_auto]"
                key={connection.id}
              >
                <select
                  className="input bg-white"
                  onChange={(event) =>
                    updateConnection(connection.id, {
                      targetPearlId: event.currentTarget.value,
                    })
                  }
                  value={connection.targetPearlId}
                >
                  {availablePearls.map((pearl) => (
                    <option key={pearl.id} value={pearl.id}>
                      {pearl.envelope.title || "Untitled Pearl"}
                    </option>
                  ))}
                </select>
                <input
                  className="input bg-white"
                  onChange={(event) =>
                    updateConnection(connection.id, {
                      note: event.currentTarget.value,
                    })
                  }
                  placeholder="Why are these Pearls connected?"
                  value={connection.note}
                />
                <button
                  className="rounded-full border border-stone-300 px-3 py-2 text-sm"
                  onClick={() => removeConnection(connection.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
            {!draft.connections.length && (
              <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-500">
                Add explicit links when another Pearl becomes relevant.
              </p>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
