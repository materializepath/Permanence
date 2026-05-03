import type { Pearl } from "@/lib/pearls/types";

export type PearlThumbnail =
  | { kind: "image"; url: string; alt: string }
  | { kind: "placeholder"; label: string };

export function getPearlThumbnail(pearl: Pearl): PearlThumbnail {
  const explicitThumbnail = getImageThumbnailUrl(pearl.envelope.thumbnailUrl);

  if (explicitThumbnail) {
    return {
      kind: "image",
      url: explicitThumbnail,
      alt: pearl.envelope.title || "Pearl thumbnail",
    };
  }

  const youtubeId = extractYouTubeId(pearl.envelope.source);

  if (youtubeId) {
    return {
      kind: "image",
      url: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      alt: pearl.envelope.title || "YouTube Pearl thumbnail",
    };
  }

  const firstAttachment = pearl.attachments.find((attachment) =>
    isImageUrl(attachment.url),
  );

  if (firstAttachment) {
    return {
      kind: "image",
      url: firstAttachment.url,
      alt: firstAttachment.label || pearl.envelope.title || "Pearl thumbnail",
    };
  }

  return {
    kind: "placeholder",
    label: getInitials(pearl.envelope.title || pearl.envelope.sourceType || "Pearl"),
  };
}

export function extractYouTubeId(source: string) {
  try {
    const url = new URL(source);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || undefined;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (url.searchParams.get("v")) {
        return url.searchParams.get("v") ?? undefined;
      }

      const parts = url.pathname.split("/").filter(Boolean);

      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1];
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function getImageThumbnailUrl(source: string) {
  if (!source) {
    return undefined;
  }

  const youtubeId = extractYouTubeId(source);

  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  if (isImageUrl(source) || isDataImageUrl(source)) {
    return source;
  }

  return undefined;
}

function isImageUrl(url: string) {
  return /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(url);
}

function isDataImageUrl(url: string) {
  return /^data:image\/(?:avif|gif|jpe?g|png|webp);base64,/i.test(url);
}

function getInitials(label: string) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return initials || "P";
}
