import { API_BASE_URL } from "../constants/config";

export type Campaign = {
  campaign_id: number;
  campaign_title: string;
  campaign_start_date: string;
  campaign_end_date: string;
  campaign_budget: number;
  campaign_spend: number;
  campaign_bidding: "click" | "view";
  audience_countries: string;
  audience_gender: string;
  audience_relationship: string;
  ads_title: string | null;
  ads_description: string | null;
  ads_type: string;
  ads_url: string | null;
  ads_post_url: string | null;
  ads_page: number | null;
  ads_group: number | null;
  ads_event: number | null;
  ads_placement: "newsfeed" | "sidebar";
  ads_image: string;
  campaign_created_date: string;
  campaign_is_active: "0" | "1";
  campaign_is_approved: "0" | "1";
  campaign_is_declined: "0" | "1";
  campaign_views: number;
  campaign_clicks: number;
};

export async function serveAd(
  q: { placement: "newsfeed" | "sidebar"; country_id?: string | number; gender?: string; relationship?: string },
  headers?: any
) {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });
  
  const r = await fetch(`${API_BASE_URL}/api/ads/serve?${params.toString()}`, {
    headers,
  });
  return r.json();
}

export async function trackView(id: number, headers?: any) {
  return fetch(`${API_BASE_URL}/api/ads/${id}/track-view`, {
    method: "POST",
    headers,
  }).then((r) => r.json());
}

export async function trackClick(id: number, headers?: any) {
  return fetch(`${API_BASE_URL}/api/ads/${id}/track-click`, {
    method: "POST",
    headers,
  }).then((r) => r.json());
}

export async function getAudienceHints(headers?: any) {
  const r = await fetch(`${API_BASE_URL}/api/ads/whoami`, { headers });
  return r.json(); // { ok, country_id, gender, relationship }
}
