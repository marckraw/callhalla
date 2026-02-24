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
    <Card className="border-border/80 bg-card/90">
      <CardContent className="space-y-3 p-4">
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
          <p className="text-sm text-muted-foreground">
            {totalCount === 0 ? "No saved requests yet." : "No requests match your search."}
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div className="space-y-2 rounded-xl border border-border bg-background p-3" key={item.id}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.draft.method} {item.draft.url}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatUpdatedAt(item.updatedAt)}</p>
                </div>
                {item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge className="font-normal" key={`${item.id}-${tag}`} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
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
