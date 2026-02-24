export type Workspace = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Environment = {
  id: string;
  workspaceId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceVariable = {
  id: string;
  key: string;
  description: string;
  isSecret: boolean;
  value: string;
  enabled: boolean;
};

export type WorkspaceContext = {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  environments: Environment[];
  activeEnvironmentId: string;
  variables: WorkspaceVariable[];
};

export type WorkspaceVariableValueInput = {
  variableId: string;
  value: string;
  enabled: boolean;
};
