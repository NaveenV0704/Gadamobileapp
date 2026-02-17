import { getUserBalance, type UserBalance } from "./pointsServcice";
import { API_BASE_URL } from "../constants/config";

export interface PackageItem {
  package_id: number;
  name: string;
  price: string;
  period_num: number;
  period: string;
  color: string;
  icon: string;
  boost_posts: number;
  boost_pages: number;
  verification_badge_enabled: string;
  custom_description: string;
}

export interface ActivePlan {
  payment_id: number;
  package_name: string;
  package_price: number;
  payment_date: string;
}

export interface PackagesResponse {
  status: boolean;
  data: PackageItem[];
  walletBalance?: number;
  activePlan?: ActivePlan | null;
}

export async function fetchAvailableBalance(token?: string): Promise<UserBalance> {
  return getUserBalance(token);
}

export async function fetchPackages(token?: string): Promise<PackagesResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}/api/packages`, {
    method: "GET",
    headers,
  });
  const text = await res.text();
  let payload: any;
  try {
    payload = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(text || "Invalid JSON response");
    throw new Error("Invalid JSON response");
  }
  if (!res.ok) {
    const msg = String(payload?.message ?? "Something went wrong");
    throw new Error(msg);
  }
  return payload as PackagesResponse;
}
