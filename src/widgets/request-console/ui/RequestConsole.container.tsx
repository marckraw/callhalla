"use client";

import { useState } from "react";
import { ApiRequestWorkbench } from "@/features/api-request";
import { SignOutButton } from "@/features/auth";
import { WorkspaceControls } from "@/features/workspace-context";

type RequestConsoleProps = {
  userEmail: string;
};

export const RequestConsole = ({ userEmail }: RequestConsoleProps) => {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [variableSuggestions, setVariableSuggestions] = useState<string[]>([]);

  return (
    <main className="flex min-h-screen w-full flex-col p-3 sm:p-4">
      <div className="grid min-h-[calc(100vh-1.5rem)] w-full gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
        <WorkspaceControls
          onActiveWorkspaceChange={setActiveWorkspaceId}
          onVariableSuggestionsChange={setVariableSuggestions}
        />

        <section className="flex min-h-0 flex-col gap-4">
          <header className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="inline-flex w-fit rounded-full border border-border bg-secondary px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Callhalla v0.3
                </p>
                <div className="flex items-center gap-3">
                  <p className="max-w-[260px] truncate text-sm text-muted-foreground">{userEmail}</p>
                  <SignOutButton />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Send your requests to Callhalla
                </h1>
                <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                  Workspaces isolate saved requests and environments. Variable placeholders resolve
                  server-side before dispatch.
                </p>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1">
            <ApiRequestWorkbench
              activeWorkspaceId={activeWorkspaceId}
              variableSuggestions={variableSuggestions}
            />
          </div>
        </section>
      </div>
    </main>
  );
};
