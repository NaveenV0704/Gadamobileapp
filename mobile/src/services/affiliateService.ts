import { API_BASE_URL } from "../constants/config";

export type AffiliateOverview = {
  settings: {
    enabled: boolean;
    levels: number;
    type: string;
    minWithdrawal: number;
    transferEnabled: boolean;
    withdrawEnabled: boolean;
    [key: string]: any;
  };
  shareLink: string;
  balance: { affiliate: number; wallet: number };
  referrals: { perLevel: number[]; total: number };
};

export type AffiliateReferralItem = {
  id: number;
  username: string;
  fullName: string;
  avatar?: string | null;
  joinedAt?: string;
};

export type AffiliateReferralsResponse = {
  items: AffiliateReferralItem[];
  total: number;
};

export async function getAffOverview(
  headers: Record<string, string>,
): Promise<AffiliateOverview> {
  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const res = await fetch(`${API_BASE_URL}/api/affiliates/overview`, {
    headers: requestHeaders,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to load affiliate overview");
  }
  return res.json();
}

export async function getAffReferrals(
  headers: Record<string, string>,
  opts: { page?: number; limit?: number; level?: number; search?: string } = {},
): Promise<AffiliateReferralsResponse> {
  const q = new URLSearchParams();
  if (opts.page) q.set("page", String(opts.page));
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.level) q.set("level", String(opts.level));
  if (opts.search) q.set("search", opts.search);

  const requestHeaders = { ...headers };
  delete requestHeaders["Content-Type"];

  const res = await fetch(
    `${API_BASE_URL}/api/affiliates/referrals?${q.toString()}`,
    { headers: requestHeaders },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to load referrals");
  }
  return res.json();
}

export async function affTransfer(
  headers: Record<string, string>,
  amount: number,
): Promise<void> {
  const jsonHeaders = { ...headers, "Content-Type": "application/json" };

  const res = await fetch(`${API_BASE_URL}/api/affiliates/transfer`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ amount }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = "Affiliate transfer failed";
    if (text) {
      try {
        const parsed = JSON.parse(text);
        message =
          String((parsed as any).error) ||
          String((parsed as any).message) ||
          text;
      } catch {
        message = text;
      }
    }
    throw new Error(message);
  }
}
