import { API_BASE_URL } from "../constants/config";

// Types
interface ErrorResponse {
  message?: string;
  [key: string]: any;
}

export interface Friend {
  user_id: number; 
  user_name: string; 
  profileImage: string | null;
}

export interface FriendRequest {
  id: number;
  status: number;
  fromUserId: number;
  fromUsername: string;
  fromProfileImage: string | null;
  toUserId: number;
  toUsername: string;
  toProfileImage: string;
}

// Helpers
async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  console.log(`Response from ${response.url}:`, response.status, text);

  try {
    const payload = JSON.parse(text);
    if (!response.ok) {
      const errMsg = (payload as ErrorResponse).message ?? "Something went wrong";
      throw new Error(errMsg);
    }
    return payload as T;
  } catch (e) {
      if (!response.ok) {
          throw new Error(text || "Something went wrong");
      }
      throw new Error("Invalid JSON response");
  }
}

// API Methods

// Endpoint: https://api.gada.chat/api/friends/suggestions
export async function getPeopleYouMayKnow(token?: string): Promise<Friend[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`; // Assuming token auth might be needed, adding support
  }

  const response = await fetch(`${API_BASE_URL}/api/friends/suggestions`, {
    method: "GET",
    headers: headers,
  });
  return handleResponse<Friend[]>(response);
}

// Endpoint: https://api.gada.chat/api/friends/requests
export async function getFriendRequests(token?: string): Promise<FriendRequest[]> {
    const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/friends/requests`, {
    method: "GET",
    headers: headers,
  });
  return handleResponse<FriendRequest[]>(response);
}

// Endpoint: https://api.gada.chat/api/friends/list
export async function getYourFriends(token?: string): Promise<Friend[]> {
    const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/friends/list`, {
    method: "GET",
    headers: headers,
  });
  return handleResponse<Friend[]>(response);
}

// Endpoint: https://api.gada.chat/api/users/search?q={query}
export async function searchFriends(query: string, token?: string): Promise<Friend[]> {
    const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: headers,
  });
  return handleResponse<Friend[]>(response);
}
// Endpoint: https://api.gada.chat/api/friends/requests (POST)
export async function sendFriendRequest(toUserId: number | string, token?: string): Promise<any> {
    const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/friends/requests`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ toUserId }),
  });
  return handleResponse<any>(response);
}

// Endpoint: https://api.gada.chat/api/friends/requests/:id (PUT)
export async function respondToFriendRequest(requestId: number | string, action: "accepted" | "declined", token?: string): Promise<any> {
    const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/friends/requests/${requestId}`, {
    method: "PUT",
    headers: headers,
    body: JSON.stringify({ action }),
  });
  return handleResponse<any>(response);
}
