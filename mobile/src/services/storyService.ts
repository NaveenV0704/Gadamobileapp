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
  console.log(
    `[StoryService] Headers:`,
    JSON.stringify(requestHeaders, null, 2),
  );

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
    console.log(
      `[StoryService] Success. Fetched ${Array.isArray(data) ? data.length : "unknown"} stories`,
    );
    return data;
  } catch (error) {
    console.error(`[StoryService] Network or parsing error:`, error);
    throw error;
  }
}
