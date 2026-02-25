import type { SavedRequest } from "@/shared";
import { Badge, Button, Card, CardContent, Input } from "@/shared";

const formatUpdatedAt = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return `${parsed.toISOString().replace("T", " ").slice(0, 19)} UTC`;
};

type SavedRequestsPanelProps = {
  items: SavedRequest[];
  searchQuery: string;
  isLoading: boolean;
  errorMessage: string | null;
  totalCount: number;
  filteredCount: number;
  onSearchQueryChange: (value: string) => void;
  onRefresh: () => void;
  onLoad: (item: SavedRequest) => void;
  onDelete: (item: SavedRequest) => void;
};

export const SavedRequestsPanel = ({
  items,
  searchQuery,
  isLoading,
  errorMessage,
  totalCount,
  filteredCount,
  onSearchQueryChange,
  onRefresh,
  onLoad,
  onDelete,
}: SavedRequestsPanelProps) => {
  return (
    <Card className="border-border/80 bg-card/90 shadow-sm">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Saved Requests</h2>
            <p className="text-xs text-muted-foreground">
              Showing {filteredCount} of {totalCount}
            </p>
          </div>
          <Button disabled={isLoading} onClick={onRefresh} size="sm" type="button" variant="secondary">
            Refresh
          </Button>
        </div>

        <Input
          placeholder="Search by name, method, URL, or tag"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-background/25 p-3 text-sm text-muted-foreground">
            {totalCount === 0 ? "No saved requests yet." : "No requests match your search."}
          </div>
        ) : (
          <div className="max-h-[52vh] space-y-2 overflow-auto pr-1 md:max-h-[calc(100vh-18rem)]">
            {items.map((item) => (
              <div className="space-y-3 rounded-xl border border-border/70 bg-background/65 p-3" key={item.id}>
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug">{item.name}</p>
                    <Badge className="shrink-0 font-semibold" variant="secondary">
                      {item.draft.method}
                    </Badge>
                  </div>
                  <p className="break-all text-xs text-muted-foreground">
                    {item.draft.url}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatUpdatedAt(item.updatedAt)}
                  </p>
                </div>
                {item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <Badge className="font-normal" key={`${item.id}-${tag}`} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No tags</p>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => onLoad(item)} size="sm" type="button">
                    Load
                  </Button>
                  <Button onClick={() => onDelete(item)} size="sm" type="button" variant="destructive">
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
