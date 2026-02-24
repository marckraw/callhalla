import type { ProxyRequestPayload, ProxyResponse } from "@/shared";

export const executeProxyRequest = async (payload: ProxyRequestPayload): Promise<ProxyResponse> => {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProxyResponse | { error: string };

  if (!response.ok) {
    const message = "error" in data ? data.error : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as ProxyResponse;
};
