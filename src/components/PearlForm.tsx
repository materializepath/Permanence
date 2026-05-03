import { SacredButton, SacredField } from "@/components/sacred/Sacred";
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
      className="sacred-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="sacred-form__header">
        <h2>Shape the encounter</h2>
        <div className="sacred-form__actions">
          <SacredButton onClick={onCancel} tone="ghost" type="button">
            Cancel
          </SacredButton>
          <SacredButton tone="primary" type="submit">
            Save Pearl
          </SacredButton>
        </div>
      </div>

      <div className="sacred-form__body">
      <div className="sacred-form__grid">
        <SacredField label="Title">
          <input
            className="sacred-input"
            onChange={(event) => updateEnvelope({ title: event.currentTarget.value })}
            placeholder="Duchamp Readymades at MoMA"
            required
            value={draft.envelope.title}
          />
        </SacredField>
        <SacredField label="Source URL or location">
          <input
            className="sacred-input"
            onChange={(event) => updateEnvelope({ source: event.currentTarget.value })}
            placeholder="Museum, book, URL, screening..."
            value={draft.envelope.source}
          />
        </SacredField>
        <SacredField label="Author">
          <input
            className="sacred-input"
            onChange={(event) => updateEnvelope({ author: event.currentTarget.value })}
            placeholder="Artist, writer, maker..."
            value={draft.envelope.author}
          />
        </SacredField>
        <SacredField label="Location">
          <input
            className="sacred-input"
            onChange={(event) => updateEnvelope({ location: event.currentTarget.value })}
            placeholder="Where did you encounter it?"
            value={draft.envelope.location}
          />
        </SacredField>
        <SacredField label="Source type">
          <select
            className="sacred-input"
            onChange={(event) =>
              updateEnvelope({ sourceType: event.currentTarget.value as SourceType })
            }
            value={draft.envelope.sourceType ?? "other"}
          >
            {sourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {sourceType}
              </option>
            ))}
          </select>
        </SacredField>
        <SacredField label="Date of encounter">
          <input
            className="sacred-input"
            onChange={(event) =>
              updateEnvelope({
                date: event.currentTarget.value,
                encounterDate: event.currentTarget.value,
              })
            }
            type="date"
            value={draft.envelope.date || draft.envelope.encounterDate || ""}
          />
        </SacredField>
        <SacredField label="Tags">
          <input
            className="sacred-input"
            onChange={(event) =>
              updateEnvelope({ tags: parseTags(event.currentTarget.value) })
            }
            placeholder="authorship, memory, cinema"
            value={(draft.envelope.tags ?? []).join(", ")}
          />
        </SacredField>
        <SacredField label="Mood">
          <textarea
            className="sacred-input"
            onChange={(event) => updateEnvelope({ mood: event.currentTarget.value })}
            placeholder="What was your headspace?"
            value={draft.envelope.mood}
          />
        </SacredField>
      </div>

      <div className="sacred-form__stack">
        <SacredField label="Experiential Record">
          <textarea
            className="sacred-input"
            onChange={(event) =>
              updateDraft({ experientialRecord: event.currentTarget.value })
            }
            placeholder="What did it feel like to encounter this?"
            value={draft.experientialRecord}
          />
        </SacredField>
        <SacredField label="Intellectual Synthesis">
          <textarea
            className="sacred-input"
            onChange={(event) =>
              updateDraft({ intellectualSynthesis: event.currentTarget.value })
            }
            placeholder="What did you learn, connect, or want to make?"
            value={draft.intellectualSynthesis}
          />
        </SacredField>
        <section>
          <div className="sacred-panel__header">
            <h2>Connections</h2>
            <SacredButton
              disabled={!availablePearls.length}
              onClick={addConnection}
              type="button"
            >
              Add connection
            </SacredButton>
          </div>
          <div className="sacred-form__connections">
            {draft.connections.map((connection) => (
              <div
                className="sacred-form__connection-row"
                key={connection.id}
              >
                <select
                  className="sacred-input"
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
                  className="sacred-input"
                  onChange={(event) =>
                    updateConnection(connection.id, {
                      note: event.currentTarget.value,
                    })
                  }
                  placeholder="Why are these Pearls connected?"
                  value={connection.note}
                />
                <SacredButton
                  onClick={() => removeConnection(connection.id)}
                  tone="ghost"
                  type="button"
                >
                  Remove
                </SacredButton>
              </div>
            ))}
            {!draft.connections.length && (
              <p className="sacred-empty">
                Add explicit links when another Pearl becomes relevant.
              </p>
            )}
          </div>
        </section>
      </div>
      </div>
    </form>
  );
}
