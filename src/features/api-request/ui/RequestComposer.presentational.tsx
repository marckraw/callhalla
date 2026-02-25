import type { BodyMode, HeaderRow, HttpMethod } from "@/shared";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared";
import { TemplateAutocompleteField } from "./TemplateAutocompleteField.container";

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
  isEditingSavedRequest: boolean;
  isSubmitting: boolean;
  isSaving: boolean;
  variableSuggestions: string[];
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
  isEditingSavedRequest,
  isSubmitting,
  isSaving,
  variableSuggestions,
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
    <Card className="border-border/80 bg-card/90 shadow-sm">
      <CardContent className="space-y-5 p-4 sm:p-5">
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Request Target
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={method} onValueChange={(value) => onMethodChange(value as HttpMethod)}>
              <SelectTrigger className="sm:w-[140px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                {methods.map((httpMethod) => (
                  <SelectItem key={httpMethod} value={httpMethod}>
                    {httpMethod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="min-w-0 flex-1">
              <TemplateAutocompleteField
                placeholder="https://api.example.com/v1/resources or {{base_url}}/resources"
                variableSuggestions={variableSuggestions}
                value={url}
                onValueChange={onUrlChange}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border/70 bg-background/35 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Headers</h2>
            <Button onClick={onAddHeader} size="sm" type="button" variant="secondary">
              Add Header
            </Button>
          </div>
          <div className="space-y-2">
            {headers.map((header) => (
              <div className="rounded-lg border border-border/70 bg-background/70 p-2" key={header.id}>
                <div className="grid items-center gap-2 sm:grid-cols-[auto_1fr_1fr_auto]">
                  <Checkbox
                    aria-label="Enable header"
                    checked={header.enabled}
                    onCheckedChange={(checked) =>
                      onHeaderChange(header.id, {
                        enabled: checked === true,
                      })
                    }
                  />
                  <TemplateAutocompleteField
                    placeholder="Header key"
                    variableSuggestions={variableSuggestions}
                    value={header.key}
                    onValueChange={(nextValue) => onHeaderChange(header.id, { key: nextValue })}
                  />
                  <TemplateAutocompleteField
                    placeholder="Header value"
                    variableSuggestions={variableSuggestions}
                    value={header.value}
                    onValueChange={(nextValue) => onHeaderChange(header.id, { value: nextValue })}
                  />
                  <Button
                    aria-label="Remove header"
                    onClick={() => onRemoveHeader(header.id)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border/70 bg-background/35 p-3">
          <h2 className="text-sm font-semibold">Body</h2>
          <Tabs value={bodyMode} onValueChange={(value) => onBodyModeChange(value as BodyMode)}>
            <TabsList className="grid w-full max-w-[280px] grid-cols-3">
              <TabsTrigger value="none">None</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
            </TabsList>
          </Tabs>

          {bodyMode !== "none" ? (
            <TemplateAutocompleteField
              className="min-h-[180px] bg-background/80"
              multiline
              placeholder={bodyMode === "json" ? '{\n  "hello": "callhalla"\n}' : "raw text body"}
              variableSuggestions={variableSuggestions}
              value={bodyText}
              onValueChange={onBodyTextChange}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No body will be sent for this request.
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-xl border border-border/70 bg-background/35 p-3">
          <h2 className="text-sm font-semibold">
            {isEditingSavedRequest ? "Update Loaded Request" : "Save Request"}
          </h2>
          <Input
            placeholder="Request name (for example: Get users list)"
            value={saveName}
            onChange={(event) => onSaveNameChange(event.target.value)}
          />
          <Input
            placeholder="Tags (comma-separated, for example: users, prod, auth)"
            value={saveTagsText}
            onChange={(event) => onSaveTagsTextChange(event.target.value)}
          />
          <div className="flex justify-end">
            <Button disabled={isSaving} onClick={onSave} type="button">
              {isSaving ? "Saving..." : isEditingSavedRequest ? "Update" : "Save"}
            </Button>
          </div>
        </section>

        {validationErrors.length > 0 ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
            <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button className="h-10 w-full" disabled={isSubmitting} onClick={onSubmit} type="button">
          {isSubmitting ? "Calling..." : "Send To Callhalla"}
        </Button>
      </CardContent>
    </Card>
  );
};
