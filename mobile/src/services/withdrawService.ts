import { API_BASE_URL } from "../constants/config";

export type WithdrawRow = {
  id: number;
  amount: string;                 // stored as varchar in table
  method: "bank" | "gada_token";
  transferTo: string;             // method_value
  time: string;                   // ISO/date
  status: -1 | 0 | 1;             // declined / pending / approved
};

export type FetchWithdrawalsResponse = {
  data: WithdrawRow[];
  page: number;
  hasMore: boolean;
};

export async function createWithdrawal(
  headers: Record<string, string>,
  payload: { amount: number; method: "bank" | "gada_token"; transferTo: string }
) {
  const res = await fetch(`${API_BASE_URL}/api/wallet/withdrawals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to create withdrawal");
  }
  return res.json();
}

export async function fetchWithdrawals(
  headers: Record<string, string>,
  params: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    method?: string;
    q?: string;
  } = {}
) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "all") {
      queryParams.append(key, String(value));
    }
  });

  const url = `${API_BASE_URL}/api/wallet/withdrawals?${queryParams.toString()}`;
  const res = await fetch(url, { headers });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to fetch withdrawals");
  }
  
  return (await res.json()) as FetchWithdrawalsResponse;
}
