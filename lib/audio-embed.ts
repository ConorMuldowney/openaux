const YOUTUBE_HOSTNAME_PATTERN = /(^|\.)(youtube\.com|youtu\.be)$/i;
const SOUNDCLOUD_HOSTNAME_PATTERN = /(^|\.)soundcloud\.com$/i;
const AUDIO_FILE_EXTENSION_PATTERN = /\.(mp3|wav|flac|aac|m4a|ogg)(\?.*)?$/i;

export type SampleEmbedKind = "youtube" | "soundcloud" | "audio-file" | "link";

function parseHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function getYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith("youtu.be")) {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.pathname === "/watch") {
      return parsed.searchParams.get("v");
    }
    if (parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.replace("/embed/", "") || null;
    }
    if (parsed.pathname.startsWith("/shorts/")) {
      return parsed.pathname.replace("/shorts/", "") || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function classifySampleLink(sample: string): SampleEmbedKind {
  if (sample.startsWith("s3://")) {
    return "audio-file";
  }

  const hostname = parseHostname(sample);
  if (hostname && YOUTUBE_HOSTNAME_PATTERN.test(hostname) && getYoutubeVideoId(sample)) {
    return "youtube";
  }
  if (hostname && SOUNDCLOUD_HOSTNAME_PATTERN.test(hostname)) {
    return "soundcloud";
  }
  if (AUDIO_FILE_EXTENSION_PATTERN.test(sample)) {
    return "audio-file";
  }
  return "link";
}

export function getYoutubeEmbedUrl(sample: string): string | null {
  const videoId = getYoutubeVideoId(sample);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export function getSoundcloudEmbedUrl(sample: string): string {
  const params = new URLSearchParams({
    url: sample,
    color: "ff6a3d",
    auto_play: "false",
    hide_related: "true",
    show_comments: "false",
    show_user: "true",
    show_reposts: "false",
    visual: "false",
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}
