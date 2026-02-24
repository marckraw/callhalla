import type { ProxyResponse, RequestDraft } from "@/shared";

type ProxyErrorResponse = {
  error?: string;
  missingVariables?: string[];
  invalidVariables?: string[];
  errors?: string[];
  debug?: {
    code?: string | null;
    cause?: string | null;
    targetHost?: string;
    hint?: string | null;
  };
};

const buildProxyErrorMessage = (payload: ProxyErrorResponse, status: number): string => {
  if (payload.error) {
    return payload.error;
  }

  if (payload.missingVariables && payload.missingVariables.length > 0) {
    return `Missing variables: ${payload.missingVariables.join(", ")}.`;
  }

  if (payload.invalidVariables && payload.invalidVariables.length > 0) {
    return `Invalid variables: ${payload.invalidVariables.join(", ")}.`;
  }

  if (payload.errors && payload.errors.length > 0) {
    return payload.errors.join(" ");
  }

  if (payload.debug?.hint) {
    return payload.debug.hint;
  }

  return `Request failed with status ${status}`;
};

export const executeProxyRequest = async (draft: RequestDraft): Promise<ProxyResponse> => {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(draft),
  });

  const data = (await response.json()) as ProxyResponse | ProxyErrorResponse;

  if (!response.ok) {
    throw new Error(buildProxyErrorMessage(data as ProxyErrorResponse, response.status));
  }

  return data as ProxyResponse;
};
