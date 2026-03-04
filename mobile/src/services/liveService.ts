import { API_BASE_URL } from "../constants/config";

export type StartLivePayload = {
  postId: number;
  channelName: string;
  agoraUid: number;
  thumbnailDataUrl?: string | null;
};

export type StartLiveResp = {
  ok: boolean;
  live: {
    liveId: number;
    postId: number;
    channelName: string;
    agoraUid: number;
    video_thumbnail?: string;
  };
};

type HeadersLike = Record<string, string>;

async function safeText(r: Response) {
  try {
    return await r.text();
  } catch {
    return "";
  }
}

export async function createLivePost(
  payload: {
    type: "live";
    text: string;
    privacy: "public" | "friends" | "only_me";
    userId?: number | string | null;
  },
  headers: HeadersLike,
): Promise<number> {
  const body = JSON.stringify(payload);

  // Try dedicated endpoint first
  try {
    const r = await fetch(`${API_BASE_URL}/api/posts/live`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body,
    });
    if (r.ok) {
      const j = await r.json();
      const id = j?.id ?? j?.postId ?? j?.data?.id;
      if (id) return Number(id);
    }
  } catch {}

  // Fallback to generic /api/posts
  const r2 = await fetch(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
  if (!r2.ok) {
    const t = await safeText(r2);
    throw new Error(`Create post failed (${r2.status}) ${t}`);
  }
  const j2 = await r2.json();
  const id2 = j2?.id ?? j2?.postId ?? j2?.data?.id;
  if (!id2) throw new Error("Create post: missing id in response");
  return Number(id2);
}

export async function startLive(
  payload: StartLivePayload,
  headers: HeadersLike,
): Promise<StartLiveResp> {
  const r = await fetch(`${API_BASE_URL}/api/live/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await safeText(r);
    throw new Error(`Start live failed (${r.status}) ${t}`);
  }
  return (await r.json()) as StartLiveResp;
}

export async function stopLive(
  postId: number,
  headers: HeadersLike,
  thumbnailDataUrl?: string,
): Promise<{ ok: boolean }> {
  const r = await fetch(`${API_BASE_URL}/api/live/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ postId, thumbnailDataUrl }),
  });
  if (!r.ok) {
    const t = await safeText(r);
    throw new Error(`Stop live failed (${r.status}) ${t}`);
  }
  return await r.json();
}
