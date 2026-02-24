import type { WorkspaceContext, WorkspaceVariableValueInput } from "@/shared";

const readErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const readContextResponse = async (response: Response): Promise<WorkspaceContext> => {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { context: WorkspaceContext };
  return payload.context;
};

export const getWorkspaceContext = async (): Promise<WorkspaceContext> => {
  const response = await fetch("/api/workspace-context", {
    method: "GET",
    cache: "no-store",
  });

  return readContextResponse(response);
};

export const createWorkspace = async (name: string): Promise<WorkspaceContext> => {
  const response = await fetch("/api/workspaces", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  return readContextResponse(response);
};

export const renameWorkspace = async (id: string, name: string): Promise<WorkspaceContext> => {
  const response = await fetch(`/api/workspaces/${id}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  return readContextResponse(response);
};

export const activateWorkspace = async (id: string): Promise<WorkspaceContext> => {
  const response = await fetch(`/api/workspaces/${id}/activate`, {
    method: "POST",
  });

  return readContextResponse(response);
};

export const createEnvironment = async (
  workspaceId: string,
  name: string,
): Promise<WorkspaceContext> => {
  const response = await fetch(`/api/workspaces/${workspaceId}/environments`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  return readContextResponse(response);
};

export const activateEnvironment = async (
  workspaceId: string,
  environmentId: string,
): Promise<WorkspaceContext> => {
  const response = await fetch(
    `/api/workspaces/${workspaceId}/environments/${environmentId}/activate`,
    {
      method: "POST",
    },
  );

  return readContextResponse(response);
};

export const createVariable = async (
  workspaceId: string,
  input: {
    key: string;
    description: string;
    isSecret: boolean;
  },
): Promise<WorkspaceContext> => {
  const response = await fetch(`/api/workspaces/${workspaceId}/variables`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readContextResponse(response);
};

export const updateVariable = async (
  workspaceId: string,
  variableId: string,
  input: {
    key?: string;
    description?: string;
    isSecret?: boolean;
  },
): Promise<WorkspaceContext> => {
  const response = await fetch(`/api/workspaces/${workspaceId}/variables/${variableId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readContextResponse(response);
};

export const deleteVariable = async (
  workspaceId: string,
  variableId: string,
): Promise<WorkspaceContext> => {
  const response = await fetch(`/api/workspaces/${workspaceId}/variables/${variableId}`, {
    method: "DELETE",
  });

  return readContextResponse(response);
};

export const saveEnvironmentVariableValues = async (
  workspaceId: string,
  environmentId: string,
  values: WorkspaceVariableValueInput[],
): Promise<WorkspaceContext> => {
  const response = await fetch(`/api/workspaces/${workspaceId}/environments/${environmentId}/variables`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  return readContextResponse(response);
};
