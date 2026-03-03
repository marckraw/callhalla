"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HTTP_METHODS,
  type BodyMode,
  type HeaderRow,
  type HttpMethod,
  type ProxyResponse,
  type RequestDraft,
  type SavedRequest,
  toast,
} from "@/shared";
import {
  deleteSavedRequest,
  listSavedRequests,
  saveRequestDraft,
  updateSavedRequestDraft,
} from "../api/saved-requests.api";
import { executeProxyRequest } from "../api/request-executor.api";
import { buildProxyRequestPayload } from "../model/request-payload.pure";
import { formatResponseBody } from "../model/response-body.pure";
import { filterSavedRequests, parseTagsInput } from "../model/saved-requests-search.pure";
import { RequestComposer } from "./RequestComposer.presentational";
import { ResponsePanel } from "./ResponsePanel.presentational";
import { SavedRequestsPanel } from "./SavedRequestsPanel.presentational";

const createHeaderRow = (): HeaderRow => ({
  id: crypto.randomUUID(),
  key: "",
  value: "",
  enabled: true,
});

const createInitialDraft = (): RequestDraft => ({
  method: "GET",
  url: "",
  headers: [createHeaderRow()],
  bodyMode: "none",
  bodyText: "",
});

type ApiRequestWorkbenchProps = {
  activeWorkspaceId: string | null;
  variableSuggestions?: string[];
};

export const ApiRequestWorkbench = ({
  activeWorkspaceId,
  variableSuggestions = [],
}: ApiRequestWorkbenchProps) => {
  const [draft, setDraft] = useState<RequestDraft>(() => createInitialDraft());
  const [saveName, setSaveName] = useState("");
  const [saveTagsText, setSaveTagsText] = useState("");
  const [editingSavedRequestId, setEditingSavedRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [savedRequestsError, setSavedRequestsError] = useState<string | null>(null);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedRequestsLoading, setIsSavedRequestsLoading] = useState(false);

  const formattedBody = useMemo(() => {
    if (!response) {
      return "";
    }

    return formatResponseBody(response.body, response.headers);
  }, [response]);

  const filteredSavedRequests = useMemo(
    () => filterSavedRequests(savedRequests, searchQuery),
    [savedRequests, searchQuery],
  );

  const refreshSavedRequests = async (workspaceId: string) => {
    setSavedRequestsError(null);
    setIsSavedRequestsLoading(true);

    try {
      const items = await listSavedRequests({ workspaceId });
      setSavedRequests(items);
    } catch (error) {
      setSavedRequestsError(error instanceof Error ? error.message : "Unable to load saved requests.");
    } finally {
      setIsSavedRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (!activeWorkspaceId) {
      return;
    }

    setDraft(createInitialDraft());
    setSaveName("");
    setSaveTagsText("");
    setEditingSavedRequestId(null);
    setSearchQuery("");
    setValidationErrors([]);
    setRuntimeError(null);
    setResponse(null);

    void refreshSavedRequests(activeWorkspaceId);
  }, [activeWorkspaceId]);

  const handleMethodChange = (method: HttpMethod) => {
    setDraft((current) => ({ ...current, method }));
  };

  const handleBodyModeChange = (bodyMode: BodyMode) => {
    setDraft((current) => ({ ...current, bodyMode }));
  };

  const handleHeaderChange = (id: string, patch: Partial<HeaderRow>) => {
    setDraft((current) => ({
      ...current,
      headers: current.headers.map((header) =>
        header.id === id
          ? {
              ...header,
              ...patch,
            }
          : header,
      ),
    }));
  };

  const handleAddHeader = () => {
    setDraft((current) => ({
      ...current,
      headers: [...current.headers, createHeaderRow()],
    }));
  };

  const handleRemoveHeader = (id: string) => {
    setDraft((current) => {
      const remaining = current.headers.filter((header) => header.id !== id);
      return {
        ...current,
        headers: remaining.length > 0 ? remaining : [createHeaderRow()],
      };
    });
  };

  const handleSubmit = async () => {
    setRuntimeError(null);
    setValidationErrors([]);

    const validation = buildProxyRequestPayload(draft, {
      requireHttpUrl: false,
      validateJsonBody: false,
    });
    if (!validation.ok) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const nextResponse = await executeProxyRequest(draft);
      setResponse(nextResponse);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : "Unknown request error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    setValidationErrors([]);

    if (saveName.trim().length === 0) {
      setValidationErrors(["Save name is required."]);
      return;
    }

    const validation = buildProxyRequestPayload(draft, {
      requireHttpUrl: false,
      validateJsonBody: false,
    });
    if (!validation.ok) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    try {
      const tags = parseTagsInput(saveTagsText);

      const saved =
        editingSavedRequestId !== null
          ? await updateSavedRequestDraft(editingSavedRequestId, {
              name: saveName.trim(),
              tags,
              draft,
            })
          : await saveRequestDraft({
              name: saveName.trim(),
              tags,
              draft,
            });

      setSavedRequests((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setEditingSavedRequestId(saved.id);
      toast.success(editingSavedRequestId ? "Saved request updated." : "Saved request created.");
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : "Unable to save request."]);
      toast.error("Unable to save request.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (item: SavedRequest) => {
    setDraft(item.draft);
    setSaveName(item.name);
    setSaveTagsText(item.tags.join(", "));
    setEditingSavedRequestId(item.id);
    setValidationErrors([]);
    setRuntimeError(null);
  };

  const handleDelete = async (item: SavedRequest) => {
    setSavedRequestsError(null);

    try {
      await deleteSavedRequest(item.id);
      setSavedRequests((current) => current.filter((existing) => existing.id !== item.id));
      toast.success("Saved request deleted.");
      if (editingSavedRequestId === item.id) {
        setEditingSavedRequestId(null);
        setSaveName("");
        setSaveTagsText("");
      }
    } catch (error) {
      setSavedRequestsError(error instanceof Error ? error.message : "Unable to delete saved request.");
      toast.error("Unable to delete saved request.");
    }
  };

  return (
    <div className="grid w-full items-start gap-4 xl:grid-cols-[minmax(460px,1.1fr)_minmax(420px,1fr)_minmax(340px,0.9fr)]">
      <RequestComposer
        bodyMode={draft.bodyMode}
        bodyText={draft.bodyText}
        headers={draft.headers}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        isEditingSavedRequest={editingSavedRequestId !== null}
        method={draft.method}
        methods={HTTP_METHODS}
        saveName={saveName}
        saveTagsText={saveTagsText}
        url={draft.url}
        validationErrors={validationErrors}
        variableSuggestions={variableSuggestions}
        onAddHeader={handleAddHeader}
        onBodyModeChange={handleBodyModeChange}
        onBodyTextChange={(bodyText) => setDraft((current) => ({ ...current, bodyText }))}
        onHeaderChange={handleHeaderChange}
        onMethodChange={handleMethodChange}
        onRemoveHeader={handleRemoveHeader}
        onSave={handleSave}
        onSaveNameChange={setSaveName}
        onSaveTagsTextChange={setSaveTagsText}
        onSubmit={handleSubmit}
        onUrlChange={(url) => setDraft((current) => ({ ...current, url }))}
      />
      <ResponsePanel formattedBody={formattedBody} response={response} runtimeError={runtimeError} />
      <SavedRequestsPanel
        errorMessage={savedRequestsError}
        filteredCount={filteredSavedRequests.length}
        isLoading={isSavedRequestsLoading}
        items={filteredSavedRequests}
        searchQuery={searchQuery}
        totalCount={savedRequests.length}
        onDelete={handleDelete}
        onLoad={handleLoad}
        onSearchQueryChange={setSearchQuery}
        onRefresh={() => {
          if (!activeWorkspaceId) {
            return;
          }

          void refreshSavedRequests(activeWorkspaceId);
        }}
      />
    </div>
  );
};
