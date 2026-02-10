import { API_BASE_URL } from "../constants/config";
import { Post } from "../types";

interface PostResponse {
  data: Post[];
  nextCursor?: string;
  [key: string]: any;
}

export type MediaInput = { url: string; type: "image" | "video" };

export async function uploadMedia(
  files: any[],
  headers: Record<string, string>,
): Promise<MediaInput[]> {
  if (!files || files.length === 0) return [];
  const form = new FormData();

  files.forEach((f) => {
    // React Native FormData expects { uri, name, type }
    form.append("files", {
      uri: f.uri,
      name: f.fileName || "upload.jpg",
      type: f.mimeType || "image/jpeg",
    } as any);
  });

  const uploadHeaders = { ...headers };
  // Let the browser/network layer set Content-Type for FormData (multipart/form-data)
  delete uploadHeaders["Content-Type"];

  const res = await fetch(`${API_BASE_URL}/api/media/upload`, {
    method: "POST",
    body: form,
    headers: uploadHeaders,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Upload failed:", text);
    throw new Error("Media upload failed");
  }

  const data = await res.json();
  const urls: string[] = data.urls || [];

  return urls.map((u) => ({
    url: u,
    type: u.match(/\/videos\//) ? "video" : "image",
  }));
}

export async function createPost(
  userId: string | number,
  content: string,
  media: MediaInput[],
  headers: Record<string, string>,
) {
  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: Number(userId), content, media }),
  });

  if (!res.ok) {
    throw new Error("Create post failed");
  }

  return await res.json();
}

export async function fetchPosts(
  headers: Record<string, string>,
  params: {
    withPromoted?: number;
    offset?: number;
    limit?: number;
  } = {},
): Promise<any> {
  const url = new URL(`${API_BASE_URL}/api/posts`);

  // Set default params
  url.searchParams.set("withPromoted", String(params.withPromoted ?? 1));
  url.searchParams.set("offset", String(params.offset ?? 0));
  url.searchParams.set("limit", String(params.limit ?? 20));

  // Remove Content-Type for GET requests to avoid 500 errors on some backends
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  console.log(`[PostService] Fetching posts from: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: requestHeaders,
  });

  console.log(`[PostService] Response status: ${response.status}`);

  if (!response.ok) {
    const text = await response.text();
    console.error("[PostService] Fetch posts failed body:", text);
    throw new Error(`Failed to fetch posts: ${response.status}`);
  }

  const json = await response.json();

  // Adjust based on actual API response structure
  // Return full object if it has structure (promoted, items), otherwise array
  if (Array.isArray(json)) return json;
  return json;
}
