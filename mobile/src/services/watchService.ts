import { API_BASE_URL } from "../constants/config";
import { Post } from "../types";

type WatchResponse = {
  items: Post[];
  nextCursor: number | null;
};

export async function fetchWatchFeed(
  params: { limit?: number; cursor?: number | null },
  headers: Record<string, string>,
): Promise<WatchResponse> {
  const url = new URL(`${API_BASE_URL}/api/watch`);
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.cursor) url.searchParams.set("cursor", String(params.cursor));

  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const res = await fetch(url.toString(), {
    headers: requestHeaders,
    credentials: "include",
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    const msg =
      text && text.trim().length
        ? text
        : `Failed to load watch feed: ${res.status}`;
    throw new Error(msg);
  }

  try {
    const data = text ? JSON.parse(text) : {};
    return {
      items: Array.isArray((data as any).items)
        ? ((data as any).items as Post[])
        : [],
      nextCursor:
        typeof (data as any).nextCursor === "number"
          ? (data as any).nextCursor
          : null,
    };
  } catch {
    return { items: [], nextCursor: null };
  }
}

