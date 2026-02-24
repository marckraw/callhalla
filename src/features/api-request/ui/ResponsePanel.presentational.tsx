import type { ProxyResponse } from "@/shared";
import { Panel } from "@/shared";

type ResponsePanelProps = {
  response: ProxyResponse | null;
  formattedBody: string;
  runtimeError: string | null;
};

export const ResponsePanel = ({ response, formattedBody, runtimeError }: ResponsePanelProps) => {
  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold">Response</h2>
        {response ? (
          <div className="flex gap-4 text-sm text-[var(--text-muted)]">
            <span>
              Status: <strong className="text-[var(--text)]">{response.status}</strong>
            </span>
            <span>
              Time: <strong className="text-[var(--text)]">{response.durationMs} ms</strong>
            </span>
          </div>
        ) : null}
      </div>

      {runtimeError ? (
        <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {runtimeError}
        </div>
      ) : null}

      {response ? (
        <>
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Headers</h3>
            <pre className="max-h-36 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs">
              {JSON.stringify(response.headers, null, 2)}
            </pre>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Body</h3>
            <pre className="max-h-[420px] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs">
              {formattedBody.length > 0 ? formattedBody : "(empty response body)"}
            </pre>
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No request sent yet.</p>
      )}
    </Panel>
  );
};
