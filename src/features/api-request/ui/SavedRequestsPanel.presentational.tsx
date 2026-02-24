import type { SavedRequest } from "@/shared";
import { Button, Panel, TextInput } from "@/shared";

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
    <Panel className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Saved Requests</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Showing {filteredCount} of {totalCount}
          </p>
        </div>
        <Button disabled={isLoading} onClick={onRefresh} type="button">
          Refresh
        </Button>
      </div>

      <TextInput
        placeholder="Search by name, method, URL, or tag"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
      />

      {errorMessage ? (
        <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {errorMessage}
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          {totalCount === 0 ? "No saved requests yet." : "No requests match your search."}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3" key={item.id}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {item.draft.method} {item.draft.url}
                  </p>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{formatUpdatedAt(item.updatedAt)}</p>
              </div>
              {item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
                      key={`${item.id}-${tag}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex gap-2">
                <Button onClick={() => onLoad(item)} tone="primary" type="button">
                  Load
                </Button>
                <Button onClick={() => onDelete(item)} tone="danger" type="button">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
};
