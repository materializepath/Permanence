import { useRef, useState } from "react";
import { SacredButton } from "@/components/sacred/Sacred";
import { getPearlThumbnail } from "@/lib/pearls/thumbnails";
import type { Pearl, PearlDraft } from "@/lib/pearls/types";

type DetailLayout = "split" | "stacked";

export function PearlDraftModal({
  draft,
  onCancel,
  onChange,
  onSave,
}: {
  draft: PearlDraft;
  onCancel: () => void;
  onChange: (draft: PearlDraft) => void;
  onSave: () => void;
}) {
  const [layout, setLayout] = useState<DetailLayout>("split");
  const [isZoomingThumbnail, setIsZoomingThumbnail] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnail = getPearlThumbnail({
    ...draft,
    id: "draft",
    createdAt: "",
    updatedAt: "",
  } satisfies Pearl);

  function updateDraft(partial: Partial<PearlDraft>) {
    onChange({ ...draft, ...partial });
  }

  function updateEnvelope(partial: Partial<PearlDraft["envelope"]>) {
    updateDraft({ envelope: { ...draft.envelope, ...partial } });
  }

  function promptForThumbnailLink() {
    const nextUrl = window.prompt(
      "Paste an image, YouTube, tweet, Instagram, or embed URL.",
      draft.envelope.thumbnailUrl || draft.envelope.source || "",
    );

    if (nextUrl !== null) {
      const thumbnailUrl = nextUrl.trim();
      updateEnvelope({
        thumbnailUrl,
        source: thumbnailUrl || draft.envelope.source,
      });
    }
  }

  function uploadThumbnail(file: File | undefined) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateEnvelope({ thumbnailUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <form
      className={`pearl-detail-card pearl-detail-card--${layout}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <header className="pearl-detail-card__header">
        <input
          aria-label="Title"
          className="pearl-draft-title"
          onChange={(event) => updateEnvelope({ title: event.currentTarget.value })}
          value={draft.envelope.title}
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
          <SacredButton tone="primary" type="submit">
            Save Pearl
          </SacredButton>
          <SacredButton onClick={onCancel} type="button">
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
              <ThumbnailContent
                isBlank={!draft.envelope.thumbnailUrl && !draft.envelope.source}
                thumbnail={thumbnail}
              />
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
          <DraftField
            label="author"
            onChange={(author) => updateEnvelope({ author })}
            value={draft.envelope.author}
          />
          <DraftField
            label="source"
            onChange={(source) => updateEnvelope({ source })}
            value={draft.envelope.source}
          />
          <DraftField
            label="date"
            onChange={(date) => updateEnvelope({ date, encounterDate: date })}
            value={draft.envelope.date}
          />
          <DraftField
            label="location"
            onChange={(location) => updateEnvelope({ location })}
            value={draft.envelope.location}
          />
        </div>
      </section>

      <section className="pearl-detail-card__body">
        <div className="pearl-detail-card__panel">
          <h2>Diary</h2>
          <textarea
            aria-label="Diary"
            className="pearl-detail-card__diary"
            onChange={(event) =>
              updateDraft({ experientialRecord: event.currentTarget.value })
            }
            value={draft.experientialRecord}
          />
        </div>
        <div className="pearl-detail-card__panel">
          <h2>Hermes Professor</h2>
          <div className="pearl-draft-professor" />
        </div>
      </section>

      {isZoomingThumbnail ? (
        <div
          className="thumbnail-zoom"
          onClick={() => setIsZoomingThumbnail(false)}
          role="presentation"
        >
          <div className="thumbnail-zoom__content">
            <ThumbnailContent
              isBlank={!draft.envelope.thumbnailUrl && !draft.envelope.source}
              thumbnail={thumbnail}
            />
          </div>
        </div>
      ) : null}
    </form>
  );
}

function DraftField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: "text" | "date";
  onChange: (value: string) => void;
}) {
  return (
    <label className="editable-field editable-field--editing">
      <span className="editable-field__label">{label}</span>
      <input
        className="sacred-input"
        onChange={(event) => onChange(event.currentTarget.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function ThumbnailContent({
  thumbnail,
  isBlank,
}: {
  thumbnail: ReturnType<typeof getPearlThumbnail>;
  isBlank?: boolean;
}) {
  if (isBlank) {
    return <span />;
  }

  return thumbnail.kind === "image" ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img draggable={false} src={thumbnail.url} alt={thumbnail.alt} />
  ) : (
    <span>{thumbnail.label}</span>
  );
}
