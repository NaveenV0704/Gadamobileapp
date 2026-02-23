import { API_BASE_URL } from "../constants/config";

export type Reel = {
  id: number;
  videoUrl: string | null;
  caption?: string;
  createdAt: string;
  authorId: number;
  authorUsername: string;
  authorProfileImage?: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  hasLiked: boolean;
};

export type ReelComment = {
  id: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
};

type H = Record<string, string>;

async function ok<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg =
      (data as any)?.error || `Request failed with status ${r.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function fetchReels(headers: H) {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const res = await fetch(`${API_BASE_URL}/api/reels`, {
    headers: requestHeaders,
    credentials: "include",
  });
  return ok<Reel[]>(res);
}

export async function createReel(
  input: { videoUrl: string; caption?: string },
  headers: H,
) {
  const res = await fetch(`${API_BASE_URL}/api/reels`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  return ok<{ id: number }>(res);
}

export async function toggleReelLike(id: number, headers: H) {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const res = await fetch(`${API_BASE_URL}/api/reels/${id}/like`, {
    method: "POST",
    headers: requestHeaders,
    credentials: "include",
  });
  return ok<{ liked: boolean }>(res);
}

export async function shareReel(id: number, headers: H) {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const res = await fetch(`${API_BASE_URL}/api/reels/${id}/share`, {
    method: "POST",
    headers: requestHeaders,
    credentials: "include",
  });
  return ok<{ ok: true }>(res);
}

export async function getReelComments(id: number, headers: H) {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const res = await fetch(`${API_BASE_URL}/api/reels/${id}/comments`, {
    headers: requestHeaders,
    credentials: "include",
  });
  return ok<ReelComment[]>(res);
}

export async function addReelComment(id: number, content: string, headers: H) {
  const res = await fetch(`${API_BASE_URL}/api/reels/${id}/comments`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    credentials: "include",
  });
  return ok<{ ok: true }>(res);
}
