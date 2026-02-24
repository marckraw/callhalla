import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Environment,
  Workspace,
  WorkspaceContext,
  WorkspaceVariable,
} from "../types/workspace.types";

const DEFAULT_WORKSPACE_NAME = "My Workspace";
const DEFAULT_ENVIRONMENT_NAME = "local";

type WorkspaceRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type EnvironmentRow = {
  id: string;
  workspace_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type UserSettingsRow = {
  user_id: string;
  active_workspace_id: string | null;
  active_environment_id: string | null;
};

type WorkspaceVariableDefinitionRow = {
  id: string;
  key: string;
  description: string;
  is_secret: boolean;
};

type EnvironmentVariableValueRow = {
  variable_definition_id: string;
  value: string;
  enabled: boolean;
};

const toWorkspace = (row: WorkspaceRow): Workspace => ({
  id: row.id,
  name: row.name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toEnvironment = (row: EnvironmentRow): Environment => ({
  id: row.id,
  workspaceId: row.workspace_id,
  name: row.name,
  isDefault: row.is_default,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const readSingleError = (error: { message: string } | null, fallback: string) => {
  if (!error) {
    return null;
  }

  return new Error(error.message || fallback);
};

const listWorkspaces = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<WorkspaceRow[]> => {
  const { data, error } = await supabase
    .from("workspaces")
    .select("id,user_id,name,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Unable to list workspaces.");
  }

  return (data as WorkspaceRow[]) ?? [];
};

const createDefaultWorkspaceWithEnvironment = async (
  supabase: SupabaseClient,
  userId: string,
  workspaceName = DEFAULT_WORKSPACE_NAME,
): Promise<{ workspace: WorkspaceRow; environment: EnvironmentRow }> => {
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      user_id: userId,
      name: workspaceName,
    })
    .select("id,user_id,name,created_at,updated_at")
    .single();

  const normalizedWorkspaceError = readSingleError(workspaceError, "Unable to create workspace.");
  if (normalizedWorkspaceError) {
    throw normalizedWorkspaceError;
  }

  const workspaceRow = workspace as WorkspaceRow;

  const { data: environment, error: environmentError } = await supabase
    .from("environments")
    .insert({
      workspace_id: workspaceRow.id,
      name: DEFAULT_ENVIRONMENT_NAME,
      is_default: true,
    })
    .select("id,workspace_id,name,is_default,created_at,updated_at")
    .single();

  const normalizedEnvironmentError = readSingleError(
    environmentError,
    "Unable to create default environment.",
  );
  if (normalizedEnvironmentError) {
    throw normalizedEnvironmentError;
  }

  return {
    workspace: workspaceRow,
    environment: environment as EnvironmentRow,
  };
};

const listEnvironments = async (
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<EnvironmentRow[]> => {
  const { data, error } = await supabase
    .from("environments")
    .select("id,workspace_id,name,is_default,created_at,updated_at")
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Unable to list environments.");
  }

  return (data as EnvironmentRow[]) ?? [];
};

const createDefaultEnvironment = async (
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<EnvironmentRow> => {
  const { data, error } = await supabase
    .from("environments")
    .insert({
      workspace_id: workspaceId,
      name: DEFAULT_ENVIRONMENT_NAME,
      is_default: true,
    })
    .select("id,workspace_id,name,is_default,created_at,updated_at")
    .single();

  const normalizedError = readSingleError(error, "Unable to create default environment.");
  if (normalizedError) {
    throw normalizedError;
  }

  return data as EnvironmentRow;
};

const getUserSettings = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSettingsRow | null> => {
  const { data, error } = await supabase
    .from("user_settings")
    .select("user_id,active_workspace_id,active_environment_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to read user settings.");
  }

  return (data as UserSettingsRow | null) ?? null;
};

const upsertUserSettings = async (
  supabase: SupabaseClient,
  userId: string,
  activeWorkspaceId: string,
  activeEnvironmentId: string,
) => {
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      active_workspace_id: activeWorkspaceId,
      active_environment_id: activeEnvironmentId,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message || "Unable to update user settings.");
  }
};

const listWorkspaceVariablesForEnvironment = async (
  supabase: SupabaseClient,
  workspaceId: string,
  environmentId: string,
): Promise<WorkspaceVariable[]> => {
  const { data: definitions, error: definitionsError } = await supabase
    .from("workspace_variable_definitions")
    .select("id,key,description,is_secret")
    .eq("workspace_id", workspaceId)
    .order("key", { ascending: true });

  if (definitionsError) {
    throw new Error(definitionsError.message || "Unable to list workspace variables.");
  }

  const { data: values, error: valuesError } = await supabase
    .from("environment_variable_values")
    .select("variable_definition_id,value,enabled")
    .eq("environment_id", environmentId);

  if (valuesError) {
    throw new Error(valuesError.message || "Unable to list environment variable values.");
  }

  const valuesByDefinitionId = new Map<string, EnvironmentVariableValueRow>(
    ((values as EnvironmentVariableValueRow[]) ?? []).map((row) => [row.variable_definition_id, row]),
  );

  return ((definitions as WorkspaceVariableDefinitionRow[]) ?? []).map((definition) => {
    const valueRow = valuesByDefinitionId.get(definition.id);

    return {
      id: definition.id,
      key: definition.key,
      description: definition.description,
      isSecret: definition.is_secret,
      value: valueRow?.value ?? "",
      enabled: valueRow?.enabled ?? true,
    };
  });
};

const pickActiveWorkspaceId = (
  workspaces: WorkspaceRow[],
  settings: UserSettingsRow | null,
): string => {
  const fromSettings = settings?.active_workspace_id;

  if (fromSettings && workspaces.some((workspace) => workspace.id === fromSettings)) {
    return fromSettings;
  }

  return workspaces[0]!.id;
};

const pickActiveEnvironmentId = (
  environments: EnvironmentRow[],
  settings: UserSettingsRow | null,
): string => {
  const fromSettings = settings?.active_environment_id;

  if (fromSettings && environments.some((environment) => environment.id === fromSettings)) {
    return fromSettings;
  }

  return environments[0]!.id;
};

export const ensureWorkspaceContext = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<WorkspaceContext> => {
  let workspaces = await listWorkspaces(supabase, userId);
  let settings = await getUserSettings(supabase, userId);

  if (workspaces.length === 0) {
    const created = await createDefaultWorkspaceWithEnvironment(supabase, userId);

    workspaces = [created.workspace];
    settings = {
      user_id: userId,
      active_workspace_id: created.workspace.id,
      active_environment_id: created.environment.id,
    };

    await upsertUserSettings(supabase, userId, created.workspace.id, created.environment.id);
  }

  const activeWorkspaceId = pickActiveWorkspaceId(workspaces, settings);
  let environments = await listEnvironments(supabase, activeWorkspaceId);

  if (environments.length === 0) {
    const defaultEnvironment = await createDefaultEnvironment(supabase, activeWorkspaceId);
    environments = [defaultEnvironment];
  }

  const activeEnvironmentId = pickActiveEnvironmentId(environments, settings);
  await upsertUserSettings(supabase, userId, activeWorkspaceId, activeEnvironmentId);

  const variables = await listWorkspaceVariablesForEnvironment(
    supabase,
    activeWorkspaceId,
    activeEnvironmentId,
  );

  return {
    workspaces: workspaces.map(toWorkspace),
    activeWorkspaceId,
    environments: environments.map(toEnvironment),
    activeEnvironmentId,
    variables,
  };
};

export const getActiveWorkspaceId = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<string> => {
  const context = await ensureWorkspaceContext(supabase, userId);
  return context.activeWorkspaceId;
};

export const getActiveEnvironmentVariablesMap = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, string>> => {
  const context = await ensureWorkspaceContext(supabase, userId);
  const variables = context.variables.filter((item) => item.enabled);

  return Object.fromEntries(variables.map((item) => [item.key, item.value]));
};

export const assertWorkspaceOwnedByUser = async (
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<void> => {
  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to verify workspace.");
  }

  if (!data) {
    throw new Error("Workspace not found.");
  }
};

export const assertEnvironmentInWorkspace = async (
  supabase: SupabaseClient,
  workspaceId: string,
  environmentId: string,
): Promise<void> => {
  const { data, error } = await supabase
    .from("environments")
    .select("id")
    .eq("id", environmentId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to verify environment.");
  }

  if (!data) {
    throw new Error("Environment not found.");
  }
};

export const setActiveWorkspaceForUser = async (
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<void> => {
  await assertWorkspaceOwnedByUser(supabase, userId, workspaceId);

  let environments = await listEnvironments(supabase, workspaceId);
  if (environments.length === 0) {
    environments = [await createDefaultEnvironment(supabase, workspaceId)];
  }

  const activeEnvironmentId = environments[0]!.id;
  await upsertUserSettings(supabase, userId, workspaceId, activeEnvironmentId);
};

export const setActiveEnvironmentForUser = async (
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  environmentId: string,
): Promise<void> => {
  await assertWorkspaceOwnedByUser(supabase, userId, workspaceId);
  await assertEnvironmentInWorkspace(supabase, workspaceId, environmentId);
  await upsertUserSettings(supabase, userId, workspaceId, environmentId);
};

export const normalizeWorkspaceName = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_WORKSPACE_NAME;
};

export const normalizeEnvironmentName = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_ENVIRONMENT_NAME;
};
