import { API_BASE_URL } from "../constants/config";
import { Story } from "../types";

export async function fetchStories(
  headers: Record<string, string>,
): Promise<Story[]> {
  // Remove Content-Type for GET requests to avoid 500 errors on some backends
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const url = `${API_BASE_URL}/api/stories`;
  console.log(`[StoryService] Fetching stories from: ${url}`);

  try {
    const res = await fetch(url, {
      headers: requestHeaders,
    });

    console.log(`[StoryService] Response status: ${res.status}`);

    if (!res.ok) {
      if (res.status === 524) {
        throw new Error(
          "Server Timeout (Error 524): The server is taking too long to respond. Please try again later.",
        );
      }
      const text = await res.text();
      console.error(`[StoryService] Error response body: ${text}`);
      throw new Error(`fetchStories failed: ${res.status} - ${text}`);
    }

    const data = await res.json();

    // Check if the response is wrapped in a 'data' field
    if (
      data &&
      typeof data === "object" &&
      "data" in data &&
      Array.isArray(data.data)
    ) {
      return data.data;
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`[StoryService] Network or parsing error:`, error);
    throw error;
  }
}

export async function reactToStory(
  storyId: string | number,
  toUserId: string | number,
  emojiCode: number,
  headers: Record<string, string>,
) {
  const response = await fetch(`${API_BASE_URL}/api/messenger/story-reply`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      storyId,
      toUserId,
      text: null,
      emojiCode,
      previewUrl: null,
    }),
  });
  if (!response.ok) throw new Error("Failed to react to story");
  return response.json();
}

export async function replyToStory(
  storyId: string | number,
  toUserId: string | number,
  text: string,
  headers: Record<string, string>,
) {
  const response = await fetch(`${API_BASE_URL}/api/messenger/story-reply`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      storyId,
      toUserId,
      text,
      emojiCode: null,
      previewUrl: null,
    }),
  });
  if (!response.ok) throw new Error("Failed to reply to story");
  return response.json();
}

export async function markStoryAsViewed(
  storyId: string | number,
  headers: Record<string, string>,
) {
  const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/view`, {
    method: "POST",
    headers: { ...headers },
  });
  // Note: Backend might return 404 if calling GET on /view as seen in search results,
  // but user said it returns {"ok":true} for their call. Assuming POST.
  if (!response.ok) throw new Error("Failed to mark story as viewed");
  return response.json();
}

export async function fetchStoryViewers(
  storyId: string | number,
  headers: Record<string, string>,
  params: { offset?: number; limit?: number } = {},
) {
  const { offset = 0, limit = 36 } = params;
  const url = `${API_BASE_URL}/api/stories/${storyId}/viewers?offset=${offset}&limit=${limit}`;
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const response = await fetch(url, {
    headers: requestHeaders,
  });
  if (!response.ok) throw new Error("Failed to fetch story viewers");
  return response.json();
}
