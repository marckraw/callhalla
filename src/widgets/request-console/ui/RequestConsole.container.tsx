import { SignOutButton } from "@/features/auth";
import { ApiRequestWorkbench } from "@/features/api-request";

type RequestConsoleProps = {
  userEmail: string;
};

export const RequestConsole = ({ userEmail }: RequestConsoleProps) => {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Callhalla v0.2
          </p>
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--text-muted)]">{userEmail}</p>
            <SignOutButton />
          </div>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Send your requests to Callhalla</h1>
        <p className="max-w-3xl text-base text-[var(--text-muted)] sm:text-lg">
          Everything is now behind Supabase auth. You can call endpoints and save reusable requests per user account.
        </p>
      </header>
      <ApiRequestWorkbench />
    </main>
  );
};
