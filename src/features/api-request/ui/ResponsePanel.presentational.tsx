import type { ProxyResponse } from "@/shared";
import { Card, CardContent, Separator } from "@/shared";

type ResponsePanelProps = {
  response: ProxyResponse | null;
  formattedBody: string;
  runtimeError: string | null;
};

const toStatusToneClass = (status: number): string => {
  if (status >= 200 && status < 300) {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
  }

  if (status >= 400) {
    return "border-destructive/40 bg-destructive/15 text-destructive";
  }

  return "border-border bg-secondary/60 text-foreground";
};

export const ResponsePanel = ({ response, formattedBody, runtimeError }: ResponsePanelProps) => {
  return (
    <Card className="border-border/80 bg-card/90 shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Response</h2>
            <p className="text-xs text-muted-foreground">
              Status, headers, and parsed response body.
            </p>
          </div>
          {response ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full border px-2 py-1 font-semibold ${toStatusToneClass(response.status)}`}
              >
                {response.status} {response.statusText}
              </span>
              <span className="rounded-full border border-border bg-secondary/50 px-2 py-1 text-muted-foreground">
                {response.durationMs} ms
              </span>
            </div>
          ) : null}
        </div>

        {runtimeError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {runtimeError}
          </div>
        ) : null}

        {response ? (
          <>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Headers</h3>
              <pre className="max-h-44 overflow-auto rounded-lg border border-border/70 bg-background/85 p-3 text-xs leading-relaxed">
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body</h3>
              <pre className="max-h-[48vh] overflow-auto rounded-lg border border-border/70 bg-background/85 p-3 text-xs leading-relaxed md:max-h-[calc(100vh-22rem)]">
                {formattedBody.length > 0 ? formattedBody : "(empty response body)"}
              </pre>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 bg-background/25 p-4 text-sm text-muted-foreground">
            No request sent yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
