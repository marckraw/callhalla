"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkspaceContext, WorkspaceVariableValueInput } from "@/shared";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "@/shared";
import {
  activateEnvironment,
  activateWorkspace,
  createEnvironment,
  createVariable,
  createWorkspace,
  deleteVariable,
  getWorkspaceContext,
  renameWorkspace,
  saveEnvironmentVariableValues,
  updateVariable,
} from "../api/workspace-context.api";

type VariableMetaDraft = {
  key: string;
  description: string;
  isSecret: boolean;
};

type VariableValueDraft = {
  value: string;
  enabled: boolean;
};

type WorkspaceControlsProps = {
  onActiveWorkspaceChange?: (workspaceId: string) => void;
};

const toMetaDraftRecord = (context: WorkspaceContext): Record<string, VariableMetaDraft> =>
  Object.fromEntries(
    context.variables.map((item) => [
      item.id,
      {
        key: item.key,
        description: item.description,
        isSecret: item.isSecret,
      },
    ]),
  );

const toValueDraftRecord = (context: WorkspaceContext): Record<string, VariableValueDraft> =>
  Object.fromEntries(
    context.variables.map((item) => [
      item.id,
      {
        value: item.value,
        enabled: item.enabled,
      },
    ]),
  );

export const WorkspaceControls = ({ onActiveWorkspaceChange }: WorkspaceControlsProps) => {
  const [context, setContext] = useState<WorkspaceContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [renameWorkspaceName, setRenameWorkspaceName] = useState("");
  const [newEnvironmentName, setNewEnvironmentName] = useState("");
  const [newVariableKey, setNewVariableKey] = useState("");
  const [newVariableDescription, setNewVariableDescription] = useState("");
  const [newVariableSecret, setNewVariableSecret] = useState(false);

  const [variableMetaDrafts, setVariableMetaDrafts] = useState<Record<string, VariableMetaDraft>>({});
  const [variableValueDrafts, setVariableValueDrafts] = useState<Record<string, VariableValueDraft>>({});

  const activeWorkspace = useMemo(() => {
    if (!context) {
      return null;
    }

    return context.workspaces.find((workspace) => workspace.id === context.activeWorkspaceId) ?? null;
  }, [context]);

  const activeEnvironment = useMemo(() => {
    if (!context) {
      return null;
    }

    return context.environments.find((environment) => environment.id === context.activeEnvironmentId) ?? null;
  }, [context]);

  const applyContext = useCallback((nextContext: WorkspaceContext) => {
    const previousWorkspaceId = context?.activeWorkspaceId;

    setContext(nextContext);
    setError(null);
    setRenameWorkspaceName(
      nextContext.workspaces.find((workspace) => workspace.id === nextContext.activeWorkspaceId)?.name ?? "",
    );
    setVariableMetaDrafts(toMetaDraftRecord(nextContext));
    setVariableValueDrafts(toValueDraftRecord(nextContext));

    if (previousWorkspaceId !== nextContext.activeWorkspaceId) {
      onActiveWorkspaceChange?.(nextContext.activeWorkspaceId);
    }
  }, [context?.activeWorkspaceId, onActiveWorkspaceChange]);

  const refreshContext = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const nextContext = await getWorkspaceContext();
      applyContext(nextContext);
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Unable to load workspace context.");
    } finally {
      setIsLoading(false);
    }
  }, [applyContext]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  const mutateContext = async (operation: () => Promise<WorkspaceContext>, successMessage?: string) => {
    setIsMutating(true);
    setError(null);

    try {
      const nextContext = await operation();
      applyContext(nextContext);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Unable to update workspace context.";
      setError(message);
      toast.error(message);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          disabled={!context || isLoading || isMutating}
          value={context?.activeWorkspaceId}
          onValueChange={(workspaceId) => {
            void mutateContext(
              () => activateWorkspace(workspaceId),
              "Active workspace updated.",
            );
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent>
            {(context?.workspaces ?? []).map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          disabled={!context || isLoading || isMutating}
          value={context?.activeEnvironmentId}
          onValueChange={(environmentId) => {
            if (!context) {
              return;
            }

            void mutateContext(
              () => activateEnvironment(context.activeWorkspaceId, environmentId),
              "Active environment updated.",
            );
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select environment" />
          </SelectTrigger>
          <SelectContent>
            {(context?.environments ?? []).map((environment) => (
              <SelectItem key={environment.id} value={environment.id}>
                {environment.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button disabled={isLoading || isMutating} type="button" variant="secondary" onClick={() => setIsManageOpen(true)}>
          Manage
        </Button>

        <Button disabled={isLoading || isMutating} type="button" variant="secondary" onClick={() => {
          void refreshContext();
        }}>
          Refresh
        </Button>
      </div>

      {activeWorkspace ? (
        <p className="text-xs text-muted-foreground">
          Workspace: <span className="text-foreground">{activeWorkspace.name}</span> | Environment:{" "}
          <span className="text-foreground">{activeEnvironment?.name ?? "n/a"}</span>
        </p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workspace Manager</DialogTitle>
          </DialogHeader>

          {context ? (
            <Tabs defaultValue="workspaces">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
                <TabsTrigger value="environments">Environments</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-3" value="workspaces">
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">Create workspace</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Workspace name"
                      value={newWorkspaceName}
                      onChange={(event) => setNewWorkspaceName(event.target.value)}
                    />
                    <Button
                      disabled={isMutating || newWorkspaceName.trim().length === 0}
                      type="button"
                      onClick={() => {
                        void mutateContext(
                          () => createWorkspace(newWorkspaceName.trim()),
                          "Workspace created.",
                        );
                        setNewWorkspaceName("");
                      }}
                    >
                      Create
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">Rename active workspace</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Active workspace name"
                      value={renameWorkspaceName}
                      onChange={(event) => setRenameWorkspaceName(event.target.value)}
                    />
                    <Button
                      disabled={
                        isMutating ||
                        renameWorkspaceName.trim().length === 0 ||
                        !activeWorkspace
                      }
                      type="button"
                      onClick={() => {
                        if (!activeWorkspace) {
                          return;
                        }

                        void mutateContext(
                          () => renameWorkspace(activeWorkspace.id, renameWorkspaceName.trim()),
                          "Workspace renamed.",
                        );
                      }}
                    >
                      Rename
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">All workspaces</p>
                  <div className="space-y-2">
                    {context.workspaces.map((workspace) => (
                      <div className="flex items-center justify-between rounded border border-border px-3 py-2" key={workspace.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{workspace.name}</span>
                          {workspace.id === context.activeWorkspaceId ? <Badge>Active</Badge> : null}
                        </div>
                        <Button
                          disabled={isMutating || workspace.id === context.activeWorkspaceId}
                          size="sm"
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            void mutateContext(
                              () => activateWorkspace(workspace.id),
                              "Active workspace updated.",
                            );
                          }}
                        >
                          Activate
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent className="space-y-3" value="environments">
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">Create environment</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Environment name"
                      value={newEnvironmentName}
                      onChange={(event) => setNewEnvironmentName(event.target.value)}
                    />
                    <Button
                      disabled={
                        isMutating ||
                        newEnvironmentName.trim().length === 0 ||
                        !activeWorkspace
                      }
                      type="button"
                      onClick={() => {
                        if (!activeWorkspace) {
                          return;
                        }

                        void mutateContext(
                          () => createEnvironment(activeWorkspace.id, newEnvironmentName.trim()),
                          "Environment created.",
                        );
                        setNewEnvironmentName("");
                      }}
                    >
                      Create
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">All environments</p>
                  <div className="space-y-2">
                    {context.environments.map((environment) => (
                      <div
                        className="flex items-center justify-between rounded border border-border px-3 py-2"
                        key={environment.id}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{environment.name}</span>
                          {environment.id === context.activeEnvironmentId ? <Badge>Active</Badge> : null}
                          {environment.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                        </div>
                        <Button
                          disabled={isMutating || environment.id === context.activeEnvironmentId}
                          size="sm"
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            void mutateContext(
                              () => activateEnvironment(context.activeWorkspaceId, environment.id),
                              "Active environment updated.",
                            );
                          }}
                        >
                          Activate
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent className="space-y-3" value="variables">
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">Create variable definition</p>
                  <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto_auto]">
                    <Input
                      placeholder="key (snake_case)"
                      value={newVariableKey}
                      onChange={(event) => setNewVariableKey(event.target.value)}
                    />
                    <Input
                      placeholder="Description"
                      value={newVariableDescription}
                      onChange={(event) => setNewVariableDescription(event.target.value)}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={newVariableSecret}
                        onCheckedChange={(checked) => setNewVariableSecret(checked === true)}
                      />
                      Secret
                    </label>
                    <Button
                      disabled={
                        isMutating ||
                        newVariableKey.trim().length === 0 ||
                        !activeWorkspace
                      }
                      type="button"
                      onClick={() => {
                        if (!activeWorkspace) {
                          return;
                        }

                        void mutateContext(
                          () =>
                            createVariable(activeWorkspace.id, {
                              key: newVariableKey.trim().toLowerCase(),
                              description: newVariableDescription.trim(),
                              isSecret: newVariableSecret,
                            }),
                          "Variable definition created.",
                        );

                        setNewVariableKey("");
                        setNewVariableDescription("");
                        setNewVariableSecret(false);
                      }}
                    >
                      Create
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">Environment values ({activeEnvironment?.name ?? "n/a"})</p>

                  {context.variables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No variables yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {context.variables.map((variable) => {
                        const meta = variableMetaDrafts[variable.id] ?? {
                          key: variable.key,
                          description: variable.description,
                          isSecret: variable.isSecret,
                        };
                        const valueDraft = variableValueDrafts[variable.id] ?? {
                          value: variable.value,
                          enabled: variable.enabled,
                        };

                        return (
                          <div className="space-y-2 rounded border border-border p-3" key={variable.id}>
                            <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto_auto_auto]">
                              <Input
                                value={meta.key}
                                onChange={(event) =>
                                  setVariableMetaDrafts((current) => ({
                                    ...current,
                                    [variable.id]: {
                                      ...meta,
                                      key: event.target.value,
                                    },
                                  }))
                                }
                              />
                              <Input
                                value={meta.description}
                                onChange={(event) =>
                                  setVariableMetaDrafts((current) => ({
                                    ...current,
                                    [variable.id]: {
                                      ...meta,
                                      description: event.target.value,
                                    },
                                  }))
                                }
                              />
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={meta.isSecret}
                                  onCheckedChange={(checked) =>
                                    setVariableMetaDrafts((current) => ({
                                      ...current,
                                      [variable.id]: {
                                        ...meta,
                                        isSecret: checked === true,
                                      },
                                    }))
                                  }
                                />
                                Secret
                              </label>
                              <Button
                                disabled={isMutating}
                                size="sm"
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  if (!activeWorkspace) {
                                    return;
                                  }

                                  void mutateContext(
                                    () =>
                                      updateVariable(activeWorkspace.id, variable.id, {
                                        key: meta.key.trim().toLowerCase(),
                                        description: meta.description.trim(),
                                        isSecret: meta.isSecret,
                                      }),
                                    "Variable metadata updated.",
                                  );
                                }}
                              >
                                Save Meta
                              </Button>
                              <Button
                                disabled={isMutating}
                                size="sm"
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                  if (!activeWorkspace) {
                                    return;
                                  }

                                  const confirmed = window.confirm(
                                    `Delete variable \"${variable.key}\" from this workspace?`,
                                  );

                                  if (!confirmed) {
                                    return;
                                  }

                                  void mutateContext(
                                    () => deleteVariable(activeWorkspace.id, variable.id),
                                    "Variable deleted.",
                                  );
                                }}
                              >
                                Delete
                              </Button>
                            </div>

                            <div className="grid gap-2 md:grid-cols-[2fr_auto]">
                              <Input
                                type={meta.isSecret ? "password" : "text"}
                                value={valueDraft.value}
                                onChange={(event) =>
                                  setVariableValueDrafts((current) => ({
                                    ...current,
                                    [variable.id]: {
                                      ...valueDraft,
                                      value: event.target.value,
                                    },
                                  }))
                                }
                              />
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={valueDraft.enabled}
                                  onCheckedChange={(checked) =>
                                    setVariableValueDrafts((current) => ({
                                      ...current,
                                      [variable.id]: {
                                        ...valueDraft,
                                        enabled: checked === true,
                                      },
                                    }))
                                  }
                                />
                                Enabled
                              </label>
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex justify-end">
                        <Button
                          disabled={isMutating || !activeWorkspace || !activeEnvironment}
                          type="button"
                          onClick={() => {
                            if (!activeWorkspace || !activeEnvironment) {
                              return;
                            }

                            const values: WorkspaceVariableValueInput[] = context.variables.map((variable) => {
                              const valueDraft = variableValueDrafts[variable.id] ?? {
                                value: variable.value,
                                enabled: variable.enabled,
                              };

                              return {
                                variableId: variable.id,
                                value: valueDraft.value,
                                enabled: valueDraft.enabled,
                              };
                            });

                            void mutateContext(
                              () =>
                                saveEnvironmentVariableValues(
                                  activeWorkspace.id,
                                  activeEnvironment.id,
                                  values,
                                ),
                              "Environment variable values saved.",
                            );
                          }}
                        >
                          Save Values
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-sm text-muted-foreground">Loading workspace context...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
