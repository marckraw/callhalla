import type { RequestDraft, SavedRequest } from "@/shared";

type SaveRequestInput = {
  name: string;
  tags: string[];
  draft: RequestDraft;
};

const readErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

export const listSavedRequests = async (): Promise<SavedRequest[]> => {
  const response = await fetch("/api/saved-requests", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { items: SavedRequest[] };
  return payload.items;
};

export const saveRequestDraft = async (input: SaveRequestInput): Promise<SavedRequest> => {
  const response = await fetch("/api/saved-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { item: SavedRequest };
  return payload.item;
};

export const deleteSavedRequest = async (id: string): Promise<void> => {
  const response = await fetch(`/api/saved-requests/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
};
