import type { BodyMode, HeaderRow, HttpMethod } from "@/shared";
import { Button, Panel, TextArea, TextInput } from "@/shared";

type RequestComposerProps = {
  method: HttpMethod;
  methods: readonly HttpMethod[];
  url: string;
  bodyMode: BodyMode;
  bodyText: string;
  headers: HeaderRow[];
  validationErrors: string[];
  saveName: string;
  saveTagsText: string;
  isSubmitting: boolean;
  isSaving: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onBodyModeChange: (mode: BodyMode) => void;
  onBodyTextChange: (value: string) => void;
  onHeaderChange: (id: string, patch: Partial<HeaderRow>) => void;
  onAddHeader: () => void;
  onRemoveHeader: (id: string) => void;
  onSaveNameChange: (value: string) => void;
  onSaveTagsTextChange: (value: string) => void;
  onSubmit: () => void;
  onSave: () => void;
};

export const RequestComposer = ({
  method,
  methods,
  url,
  bodyMode,
  bodyText,
  headers,
  validationErrors,
  saveName,
  saveTagsText,
  isSubmitting,
  isSaving,
  onMethodChange,
  onUrlChange,
  onBodyModeChange,
  onBodyTextChange,
  onHeaderChange,
  onAddHeader,
  onRemoveHeader,
  onSaveNameChange,
  onSaveTagsTextChange,
  onSubmit,
  onSave,
}: RequestComposerProps) => {
  return (
    <Panel className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          className="h-10 min-w-28 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          value={method}
          onChange={(event) => onMethodChange(event.target.value as HttpMethod)}
        >
          {methods.map((httpMethod) => (
            <option key={httpMethod} value={httpMethod}>
              {httpMethod}
            </option>
          ))}
        </select>
        <TextInput
          placeholder="https://api.example.com/v1/resources"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Headers</h2>
          <Button onClick={onAddHeader} type="button">
            Add Header
          </Button>
        </div>
        <div className="space-y-2">
          {headers.map((header) => (
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2" key={header.id}>
              <input
                aria-label="Enable header"
                checked={header.enabled}
                type="checkbox"
                onChange={(event) => onHeaderChange(header.id, { enabled: event.target.checked })}
              />
              <TextInput
                placeholder="Header"
                value={header.key}
                onChange={(event) => onHeaderChange(header.id, { key: event.target.value })}
              />
              <TextInput
                placeholder="Value"
                value={header.value}
                onChange={(event) => onHeaderChange(header.id, { value: event.target.value })}
              />
              <Button
                aria-label="Remove header"
                onClick={() => onRemoveHeader(header.id)}
                tone="danger"
                type="button"
              >
                X
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Body</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onBodyModeChange("none")}
            tone={bodyMode === "none" ? "primary" : "default"}
            type="button"
          >
            None
          </Button>
          <Button
            onClick={() => onBodyModeChange("json")}
            tone={bodyMode === "json" ? "primary" : "default"}
            type="button"
          >
            JSON
          </Button>
          <Button
            onClick={() => onBodyModeChange("text")}
            tone={bodyMode === "text" ? "primary" : "default"}
            type="button"
          >
            Text
          </Button>
        </div>
        {bodyMode !== "none" ? (
          <TextArea
            className="min-h-[160px]"
            placeholder={bodyMode === "json" ? '{\n  "hello": "callhalla"\n}' : "raw text body"}
            value={bodyText}
            onChange={(event) => onBodyTextChange(event.target.value)}
          />
        ) : null}
      </div>

      <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
        <h2 className="text-sm font-semibold">Save Request</h2>
        <div className="space-y-2">
          <TextInput
            placeholder="Request name (for example: Get users list)"
            value={saveName}
            onChange={(event) => onSaveNameChange(event.target.value)}
          />
          <TextInput
            placeholder="Tags (comma-separated, for example: users, prod, auth)"
            value={saveTagsText}
            onChange={(event) => onSaveTagsTextChange(event.target.value)}
          />
          <div className="flex justify-end">
            <Button disabled={isSaving} onClick={onSave} type="button">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {validationErrors.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--danger)]">
          {validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <Button className="w-full" disabled={isSubmitting} onClick={onSubmit} tone="primary" type="button">
        {isSubmitting ? "Calling..." : "Send To Callhalla"}
      </Button>
    </Panel>
  );
};
