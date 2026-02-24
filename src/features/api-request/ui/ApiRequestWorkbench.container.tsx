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
} from "@/shared";
import { deleteSavedRequest, listSavedRequests, saveRequestDraft } from "../api/saved-requests.api";
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

const initialDraft: RequestDraft = {
  method: "GET",
  url: "",
  headers: [createHeaderRow()],
  bodyMode: "none",
  bodyText: "",
};

export const ApiRequestWorkbench = () => {
  const [draft, setDraft] = useState<RequestDraft>(initialDraft);
  const [saveName, setSaveName] = useState("");
  const [saveTagsText, setSaveTagsText] = useState("");
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

  const refreshSavedRequests = async () => {
    setSavedRequestsError(null);
    setIsSavedRequestsLoading(true);

    try {
      const items = await listSavedRequests();
      setSavedRequests(items);
    } catch (error) {
      setSavedRequestsError(error instanceof Error ? error.message : "Unable to load saved requests.");
    } finally {
      setIsSavedRequestsLoading(false);
    }
  };

  useEffect(() => {
    void refreshSavedRequests();
  }, []);

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

    const preparation = buildProxyRequestPayload(draft);
    if (!preparation.ok) {
      setValidationErrors(preparation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const nextResponse = await executeProxyRequest(preparation.payload);
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

    const validation = buildProxyRequestPayload(draft);
    if (!validation.ok) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    try {
      const tags = parseTagsInput(saveTagsText);

      const saved = await saveRequestDraft({
        name: saveName.trim(),
        tags,
        draft,
      });

      setSavedRequests((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setSaveName("");
      setSaveTagsText("");
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : "Unable to save request."]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (item: SavedRequest) => {
    setDraft(item.draft);
    setSaveName(item.name);
    setSaveTagsText(item.tags.join(", "));
    setValidationErrors([]);
    setRuntimeError(null);
  };

  const handleDelete = async (item: SavedRequest) => {
    setSavedRequestsError(null);

    try {
      await deleteSavedRequest(item.id);
      setSavedRequests((current) => current.filter((existing) => existing.id !== item.id));
    } catch (error) {
      setSavedRequestsError(error instanceof Error ? error.message : "Unable to delete saved request.");
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
      <RequestComposer
        bodyMode={draft.bodyMode}
        bodyText={draft.bodyText}
        headers={draft.headers}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        method={draft.method}
        methods={HTTP_METHODS}
        saveName={saveName}
        saveTagsText={saveTagsText}
        url={draft.url}
        validationErrors={validationErrors}
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
          void refreshSavedRequests();
        }}
      />
    </div>
  );
};
