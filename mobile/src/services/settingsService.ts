import { API_BASE_URL } from "../constants/config";

export type GeneralSettings = {
  id: string;
  username: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "non_binary" | "prefer_not";
  city?: string;
  country?: string;
  timezone?: string;
  language?: string;
  website?: string;
  work?: string;
  education?: string;
};

export type PrivacySettings = {
  profileVisibility: "everyone" | "friends" | "only_me";
  friendRequestPolicy: "everyone" | "friends_of_friends";
  lookupEmail: "everyone" | "friends" | "only_me";
  lookupPhone: "everyone" | "friends" | "only_me";
  showOnline: boolean;
  tagReview: boolean;
};

export type NotificationSettings = {
  inappLikes: boolean;
  inappComments: boolean;
  inappMentions: boolean;
  inappFriendRequests: boolean;
  inappGroupActivity: boolean;
  inappPayments: boolean;
  emailDigest: boolean;
  emailSecurity: boolean;
};

export type SessionRow = {
  id: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  lastSeen?: string;
};

export async function getGeneral(
  headers: Record<string, string>,
): Promise<GeneralSettings> {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const r = await fetch(`${API_BASE_URL}/api/settings/profile`, {
    headers: requestHeaders,
    credentials: "include",
  });
  if (!r.ok) throw new Error("Failed to fetch profile");
  return r.json();
}

export async function updateGeneral(
  input: Partial<GeneralSettings>,
  headers: Record<string, string>,
) {
  const r = await fetch(`${API_BASE_URL}/api/settings/profile`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error("Failed to update profile");
  return r.json();
}

export async function getPrivacy(
  headers: Record<string, string>,
): Promise<PrivacySettings> {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const r = await fetch(`${API_BASE_URL}/api/settings/privacy`, {
    headers: requestHeaders,
    credentials: "include",
  });
  if (!r.ok) throw new Error("Failed to fetch privacy");
  return r.json();
}

export async function updatePrivacy(
  input: PrivacySettings,
  headers: Record<string, string>,
) {
  const r = await fetch(`${API_BASE_URL}/api/settings/privacy`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error("Failed to update privacy");
  return r.json();
}

export async function getNotifications(
  headers: Record<string, string>,
): Promise<NotificationSettings> {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const r = await fetch(`${API_BASE_URL}/api/settings/notifications`, {
    headers: requestHeaders,
    credentials: "include",
  });
  if (!r.ok) throw new Error("Failed to fetch notifications");
  return r.json();
}

export async function updateNotifications(
  input: Partial<NotificationSettings>,
  headers: Record<string, string>,
) {
  const r = await fetch(`${API_BASE_URL}/api/settings/notifications`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error("Failed to update notifications");
  return r.json();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  headers: Record<string, string>,
) {
  const r = await fetch(`${API_BASE_URL}/api/settings/security/password`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!r.ok) {
    let msg = "Failed to change password";
    try {
      const j = await r.json();
      if (j && typeof j === "object" && "error" in j) {
        msg = String((j as any).error || msg);
      }
    } catch {
    }
  }
  return r.json();
}

export async function getSessions(
  headers: Record<string, string>,
): Promise<SessionRow[]> {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const r = await fetch(`${API_BASE_URL}/api/settings/security/sessions`, {
    headers: requestHeaders,
    credentials: "include",
  });
  if (!r.ok) throw new Error("Failed to fetch sessions");
  return r.json();
}

export async function revokeSession(
  sessionId: string,
  headers: Record<string, string>,
) {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const r = await fetch(
    `${API_BASE_URL}/api/settings/security/sessions/${sessionId}`,
    {
      method: "DELETE",
      headers: requestHeaders,
      credentials: "include",
    },
  );
  if (!r.ok) throw new Error("Failed to revoke session");
  return r.json();
}

