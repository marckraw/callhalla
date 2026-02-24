import type { ProxyResponse } from "@/shared";
import { Card, CardContent, Separator } from "@/shared";

type ResponsePanelProps = {
  response: ProxyResponse | null;
  formattedBody: string;
  runtimeError: string | null;
};

export const ResponsePanel = ({ response, formattedBody, runtimeError }: ResponsePanelProps) => {
  return (
    <Card className="border-border/80 bg-card/90">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Response</h2>
          {response ? (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                Status: <strong className="text-foreground">{response.status}</strong>
              </span>
              <span>
                Time: <strong className="text-foreground">{response.durationMs} ms</strong>
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
              <pre className="max-h-36 overflow-auto rounded-lg border border-border bg-background p-3 text-xs">
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body</h3>
              <pre className="max-h-[420px] overflow-auto rounded-lg border border-border bg-background p-3 text-xs">
                {formattedBody.length > 0 ? formattedBody : "(empty response body)"}
              </pre>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No request sent yet.</p>
        )}
      </CardContent>
    </Card>
  );
};
