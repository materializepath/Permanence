import { useRef, useState } from "react";
import { ProfessorPanel } from "@/components/ProfessorPanel";
import { SacredButton } from "@/components/sacred/Sacred";
import { getPearlThumbnail } from "@/lib/pearls/thumbnails";
import type { Pearl } from "@/lib/pearls/types";

type DetailLayout = "split" | "stacked";
type EditableFieldProps = {
  label?: string;
  value: string;
  multiline?: boolean;
  type?: "text" | "date";
  placeholder?: string;
  className?: string;
  onSave: (value: string) => void;
};

export function PearlReader({
  pearl,
  onClosePearl,
  onTranscriptChange,
  onUpdatePearl,
}: {
  pearl: Pearl;
  pearls: Pearl[];
  onEditPearl: () => void;
  onDeletePearl: () => void;
  onClosePearl: () => void;
  onSelectPearl: (id: string) => void;
  onTranscriptChange: Parameters<typeof ProfessorPanel>[0]["onTranscriptChange"];
  onUpdatePearl: (pearl: Pearl) => void;
}) {
  const [layout, setLayout] = useState<DetailLayout>("split");
  const [isZoomingThumbnail, setIsZoomingThumbnail] = useState(false);
  const thumbnail = getPearlThumbnail(pearl);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  function updateEnvelope(partial: Partial<Pearl["envelope"]>) {
    onUpdatePearl({
      ...pearl,
      envelope: {
        ...pearl.envelope,
        ...partial,
      },
    });
  }

  function updateDiary(value: string) {
    onUpdatePearl({
      ...pearl,
      experientialRecord: value,
    });
  }

  function updateThumbnailUrl(thumbnailUrl: string) {
    updateEnvelope({
      thumbnailUrl,
      source: thumbnailUrl || pearl.envelope.source,
    });
  }

  function promptForThumbnailLink() {
    const nextUrl = window.prompt(
      "Paste an image, YouTube, tweet, Instagram, or embed URL.",
      pearl.envelope.thumbnailUrl || pearl.envelope.source || "",
    );

    if (nextUrl !== null) {
      updateThumbnailUrl(nextUrl.trim());
    }
  }

  function uploadThumbnail(file: File | undefined) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateThumbnailUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <article className={`pearl-detail-card pearl-detail-card--${layout}`}>
      <header className="pearl-detail-card__header">
        <EditableField
          className="pearl-detail-card__title"
          value={pearl.envelope.title || "Untitled Pearl"}
          onSave={(title) => updateEnvelope({ title })}
        />
        <div className="pearl-detail-card__actions">
          <SacredButton
            onClick={() =>
              setLayout((current) => (current === "split" ? "stacked" : "split"))
            }
            type="button"
          >
            {layout === "split" ? "Stack" : "Split"}
          </SacredButton>
          <SacredButton onClick={onClosePearl} type="button">
            Back
          </SacredButton>
        </div>
      </header>

      <section className="pearl-detail-card__top">
        <div className="pearl-detail-card__thumbnail">
          <div className="pearl-thumbnail-frame">
            <button
              aria-label="Add thumbnail link"
              className="pearl-thumbnail-button"
              onClick={promptForThumbnailLink}
              type="button"
            >
              <ThumbnailContent thumbnail={thumbnail} />
            </button>
            <div className="pearl-thumbnail-actions">
              <button
                aria-label="Zoom thumbnail"
                className="pearl-thumbnail-action"
                data-label="Zoom"
                onClick={() => setIsZoomingThumbnail(true)}
                type="button"
              >
                ⌕
              </button>
              <button
                aria-label="Upload thumbnail"
                className="pearl-thumbnail-action"
                data-label="Upload"
                onClick={() => uploadInputRef.current?.click()}
                type="button"
              >
                ↑
              </button>
              <button
                aria-label="Embed thumbnail link"
                className="pearl-thumbnail-action"
                data-label="Embed"
                onClick={promptForThumbnailLink}
                type="button"
              >
                ↗
              </button>
            </div>
          </div>
          <input
            ref={uploadInputRef}
            className="pearl-thumbnail-upload"
            type="file"
            accept="image/*"
            onChange={(event) => {
              uploadThumbnail(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </div>

        <div className="pearl-detail-card__meta">
          <EditableField
            label="author"
            value={pearl.envelope.author}
            placeholder="Author"
            onSave={(author) => updateEnvelope({ author })}
          />
          <EditableField
            label="source"
            value={pearl.envelope.source}
            onSave={(source) => updateEnvelope({ source })}
          />
          <EditableField
            label="date"
            value={pearl.envelope.date}
            type="date"
            onSave={(date) => updateEnvelope({ date, encounterDate: date })}
          />
          <EditableField
            label="location"
            value={pearl.envelope.location}
            placeholder="Location"
            onSave={(location) => updateEnvelope({ location })}
          />
        </div>
      </section>

      <section className="pearl-detail-card__body">
        <div className="pearl-detail-card__panel">
          <h2>Diary</h2>
          <textarea
            className="pearl-detail-card__diary"
            value={pearl.experientialRecord}
            placeholder="Diary"
            onChange={(event) => updateDiary(event.currentTarget.value)}
          />
        </div>
        <div className="pearl-detail-card__panel">
          <h2>Hermes Professor</h2>
          <ProfessorPanel onTranscriptChange={onTranscriptChange} pearl={pearl} />
        </div>
      </section>

      {isZoomingThumbnail ? (
        <div
          className="thumbnail-zoom"
          onClick={() => setIsZoomingThumbnail(false)}
          role="presentation"
        >
          <div className="thumbnail-zoom__content">
            <ThumbnailContent thumbnail={thumbnail} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ThumbnailContent({ thumbnail }: { thumbnail: ReturnType<typeof getPearlThumbnail> }) {
  return thumbnail.kind === "image" ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img draggable={false} src={thumbnail.url} alt={thumbnail.alt} />
  ) : (
    <span>{thumbnail.label}</span>
  );
}

function EditableField({
  label,
  value,
  multiline = false,
  type = "text",
  placeholder,
  className = "",
  onSave,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function beginEditing() {
    setDraft(value);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(value);
    setIsEditing(false);
  }

  function saveEditing() {
    onSave(draft);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className={`editable-field editable-field--editing ${className}`.trim()}>
        {label ? <span className="editable-field__label">{label}</span> : null}
        {multiline ? (
          <textarea
            autoFocus
            className="sacred-input"
            onChange={(event) => setDraft(event.currentTarget.value)}
            placeholder={placeholder}
            value={draft}
          />
        ) : (
          <input
            autoFocus
            className="sacred-input"
            onChange={(event) => setDraft(event.currentTarget.value)}
            placeholder={placeholder}
            type={type}
            value={draft}
          />
        )}
        <span className="editable-field__actions">
          <SacredButton onClick={saveEditing} type="button">
            Save
          </SacredButton>
          <SacredButton onClick={cancelEditing} tone="ghost" type="button">
            Cancel
          </SacredButton>
        </span>
      </div>
    );
  }

  return (
    <button
      className={`editable-field ${className}`.trim()}
      onClick={beginEditing}
      type="button"
    >
      {label ? <span className="editable-field__label">{label}</span> : null}
      <span className="editable-field__value">{value || placeholder || "empty"}</span>
    </button>
  );
}
