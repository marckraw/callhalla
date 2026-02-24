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
  Textarea,
} from "@/shared";

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
    <Card className="border-border/80 bg-card/90">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={method} onValueChange={(value) => onMethodChange(value as HttpMethod)}>
            <SelectTrigger className="sm:w-[150px]">
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
          <Input
            placeholder="https://api.example.com/v1/resources"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Headers</h2>
            <Button onClick={onAddHeader} size="sm" type="button" variant="secondary">
              Add Header
            </Button>
          </div>
          <div className="space-y-2">
            {headers.map((header) => (
              <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2" key={header.id}>
                <Checkbox
                  aria-label="Enable header"
                  checked={header.enabled}
                  onCheckedChange={(checked) =>
                    onHeaderChange(header.id, {
                      enabled: checked === true,
                    })
                  }
                />
                <Input
                  placeholder="Header"
                  value={header.key}
                  onChange={(event) => onHeaderChange(header.id, { key: event.target.value })}
                />
                <Input
                  placeholder="Value"
                  value={header.value}
                  onChange={(event) => onHeaderChange(header.id, { value: event.target.value })}
                />
                <Button
                  aria-label="Remove header"
                  onClick={() => onRemoveHeader(header.id)}
                  size="icon"
                  type="button"
                  variant="destructive"
                >
                  X
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Body</h2>
          <Tabs value={bodyMode} onValueChange={(value) => onBodyModeChange(value as BodyMode)}>
            <TabsList className="grid w-full max-w-[280px] grid-cols-3">
              <TabsTrigger value="none">None</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
            </TabsList>
          </Tabs>

          {bodyMode !== "none" ? (
            <Textarea
              className="min-h-[160px]"
              placeholder={bodyMode === "json" ? '{\n  "hello": "callhalla"\n}' : "raw text body"}
              value={bodyText}
              onChange={(event) => onBodyTextChange(event.target.value)}
            />
          ) : null}
        </div>

        <div className="space-y-2 rounded-xl border border-border bg-background/65 p-3">
          <h2 className="text-sm font-semibold">
            {isEditingSavedRequest ? "Update Loaded Request" : "Save Request"}
          </h2>
          <div className="space-y-2">
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
          </div>
        </div>

        {validationErrors.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} onClick={onSubmit} type="button">
          {isSubmitting ? "Calling..." : "Send To Callhalla"}
        </Button>
      </CardContent>
    </Card>
  );
};
