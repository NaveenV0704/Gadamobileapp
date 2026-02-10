import { useMemo } from "react";

export function useAuthHeaderupload(
  accessToken: string | null,
): Record<string, string> {
  return useMemo(
    () =>
      accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
            Origin: "https://gada.chat",
            Referer: "https://gada.chat/",
          }
        : {
            "Content-Type": "application/json",
            Origin: "https://gada.chat",
            Referer: "https://gada.chat/",
          },
    [accessToken],
  );
}

export function useAuthHeader(
  accessToken: string | null,
): Record<string, string> {
  return useMemo(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: "https://gada.chat",
      Referer: "https://gada.chat/",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
  }, [accessToken]);
}
