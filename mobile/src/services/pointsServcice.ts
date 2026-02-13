import { API_BASE_URL } from "../constants/config";

export interface PointsBalances {
  points: number;
  money: number;
}

export interface PointsConversionRule {
  pointsPerNaira: number;
  enabled: boolean;
}

export interface PointsRules {
  conversion: PointsConversionRule;
  post_create: number;
  post_view: number;
  post_comment: number;
  follow: number;
  refer: number;
  daily_limit: number;
}

export interface PointsOverview {
  balances: PointsBalances;
  rules: PointsRules;
  remainingToday: number;
  windowHours: number;
}

interface ErrorResponse {
  message?: string;
  [key: string]: any;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    const payload = JSON.parse(text);
    if (!response.ok) {
      const errMsg = (payload as ErrorResponse).message ?? "Something went wrong";
      throw new Error(errMsg);
    }
    return payload as T;
  } catch {
    if (!response.ok) throw new Error(text || "Something went wrong");
    throw new Error("Invalid JSON response");
  }
}

export async function getPointsOverview(token?: string): Promise<PointsOverview> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/api/points/overview`, {
    method: "GET",
    headers,
  });
  return handleResponse<PointsOverview>(response);
}

export interface UserBalance {
  user_wallet_balance: number;
  user_points: number;
}

export async function getUserBalance(token?: string): Promise<UserBalance> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/api/users/fetchuserbalance`, {
    method: "GET",
    headers,
  });
  return handleResponse<UserBalance>(response);
}

export interface PointsLogRow {
  id: number;
  points: number;
  from: string;
  nodeId: number;
  nodeType: string;
  time: string; // ISO date string
}

export interface PointsLogsResponse {
  page: number;
  pageSize: number;
  total: number;
  rows: PointsLogRow[];
}

export async function getPointsLogs(
  token: string | undefined,
  params: { page: number; limit: number; q?: string; sort?: string; dir?: "asc" | "desc" } = {
    page: 1,
    limit: 10,
    q: "",
    sort: "time",
    dir: "desc",
  },
): Promise<PointsLogsResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = new URL(`${API_BASE_URL}/api/points/logs`);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("limit", String(params.limit));
  url.searchParams.set("q", String(params.q ?? ""));
  url.searchParams.set("sort", String(params.sort ?? "time"));
  url.searchParams.set("dir", String(params.dir ?? "desc"));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  });
  return handleResponse<PointsLogsResponse>(response);
}
