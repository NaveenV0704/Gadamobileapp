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
      const text = await res.text();
      console.error(`[StoryService] Error response body: ${text}`);
      throw new Error(`fetchStories failed: ${res.status} - ${text}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`[StoryService] Network or parsing error:`, error);
    throw error;
  }
}

export async function reactToStory(
  storyId: string | number,
  reaction: string,
  headers: Record<string, string>,
) {
  const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/react`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ reaction }),
  });
  if (!response.ok) throw new Error("Failed to react to story");
  return response.json();
}

export async function replyToStory(
  storyId: string | number,
  content: string,
  headers: Record<string, string>
) {
  const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/reply`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error("Failed to reply to story");
  return response.json();
}

