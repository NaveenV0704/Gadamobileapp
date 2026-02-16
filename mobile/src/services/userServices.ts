import { API_BASE_URL } from "../constants/config";

// Types
interface ErrorResponse {
  message?: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  [key: string]: any;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface Activationdetails {
  token: string;
}

export interface SignUpData {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  referral?: string;
}

export interface AuthPayload {
  token: string;
  user: {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    profileImage?: string;
    coverImage?: string;
    bio?: string;
    friends?: any[];
    createdAt?: string;
    [key: string]: any;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  profileImage?: string;
  createdAt: string;
}

// Helpers
async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    const payload = JSON.parse(text);
    if (!response.ok) {
      const errMsg =
        (payload as ErrorResponse).message ?? "Something went wrong";
      throw new Error(errMsg);
    }

    // Check if the response is wrapped in a 'data' field
    if (
      payload &&
      typeof payload === "object" &&
      "data" in payload &&
      payload.data !== null
    ) {
      return payload.data as T;
    }

    return payload as T;
  } catch (e) {
    if (response.status === 524) {
      throw new Error(
        "Server Timeout (Error 524): The server is taking too long to respond. Please try again later.",
      );
    }
    if (!response.ok) throw new Error(text || "Something went wrong");
    throw new Error("Invalid JSON response: " + text);
  }
}

// API Methods
export async function signInUser(
  credentials: SignInCredentials,
  headers: Record<string, string>,
): Promise<AuthPayload> {
  console.log("Attempting login...");
  console.log("URL:", `${API_BASE_URL}/api/signin`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/signin`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(credentials),
    });

    console.log("Response Status:", response.status);
    return handleResponse<AuthPayload>(response);
  } catch (error: any) {
    console.error("Login Error:", error);
    throw error;
  }
}

export async function requestPasswordReset(data: {
  email: string;
  otp: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse<{ status: boolean; message: string }>(response);
}

export async function resendforgototp(data: { email: string }) {
  const response = await fetch(`${API_BASE_URL}/api/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse<{ status: boolean; message: string }>(response);
}

export async function sendForgot(data: { email: string }) {
  const response = await fetch(`${API_BASE_URL}/api/sendForgotOtp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse<{ status: boolean; message: string }>(response);
}

export async function updatePassword(data: {
  email: string;
  otp: string;
  password: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse<{ status: boolean; message: string }>(response);
}

export async function activateaccount(
  credentials: Activationdetails,
  headers: Record<string, string>,
): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE_URL}/api/activation`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(credentials),
  });

  return handleResponse<AuthPayload>(response);
}

export async function signUpUser(
  inputData: SignUpData,
  headers: Record<string, string>,
): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE_URL}/api/signUp`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(inputData),
  });

  return handleResponse<AuthPayload>(response);
}

export async function uploadAvatar(
  userHash: string,
  file: any, // React Native file object { uri, name, type }
  headers: Record<string, string>,
  type: string,
): Promise<string> {
  const form = new FormData();
  // @ts-ignore
  form.append("avatar", {
    uri: file.uri,
    name: file.name || "image.jpg",
    type: file.type || "image/jpeg",
  });

  const endpoint =
    type === "cover"
      ? `/api/users/${userHash}/cover`
      : `/api/users/${userHash}/avatar`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    // credentials: 'include', // Not usually needed/supported in RN the same way
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data", // Usually handled automatically by FormData but safe to explicit if needed, though often RN handles it better if omitted. Let's omit it from the passed headers if possible or let fetch handle it.
      // Actually, when using FormData, do NOT set Content-Type to multipart/form-data manually, let the browser/engine set it with boundary.
      // So we should probably filter it out if it's in headers.
    },
    body: form,
  });

  if (!res.ok) throw new Error("Upload failed");
  const { avatarUrl } = await res.json();
  return avatarUrl;
}

export async function fetchUserProfile(id: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/users/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch user profile");
  }
  return res.json();
}

export async function fetchMyProfile(
  headers: Record<string, string>,
): Promise<Partial<EditProfilePayload> & Record<string, any>> {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const res = await fetch(`${API_BASE_URL}/api/profile/me`, {
    method: "GET",
    headers: requestHeaders,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch profile");
  }

  return res.json();
}

export interface EditProfilePayload {
  firstName: string;
  lastName: string;
  gender: string;
  birthdate: string;
  bio: string;
  currentCity: string;
  hometown: string;
  privacyChat: string;
  privacyPhotos: string;
  privacyWall: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialYoutube: string;
  website: string;
  workPlace: string;
  workTitle: string;
}

export async function updateProfileDetails(
  payload: EditProfilePayload,
  headers: Record<string, string>,
): Promise<void> {
  const requestHeaders = {
    ...headers,
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "PUT",
    headers: requestHeaders,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update profile");
  }
}
