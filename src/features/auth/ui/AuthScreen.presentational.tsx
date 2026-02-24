import { Button, Panel, TextInput } from "@/shared";

type AuthMode = "signin" | "signup";

type AuthScreenProps = {
  mode: AuthMode;
  email: string;
  password: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  infoMessage: string | null;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export const AuthScreen = ({
  mode,
  email,
  password,
  isSubmitting,
  errorMessage,
  infoMessage,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthScreenProps) => {
  return (
    <Panel className="mx-auto w-full max-w-md space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Callhalla Access</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Sign in to use the request console. Registration is enabled for now and can be disabled later in Supabase.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onModeChange("signin")} tone={mode === "signin" ? "primary" : "default"} type="button">
          Sign In
        </Button>
        <Button onClick={() => onModeChange("signup")} tone={mode === "signup" ? "primary" : "default"} type="button">
          Sign Up
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-[var(--text-muted)]" htmlFor="email">
            Email
          </label>
          <TextInput
            autoComplete="email"
            id="email"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-[var(--text-muted)]" htmlFor="password">
            Password
          </label>
          <TextInput
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            id="password"
            minLength={8}
            placeholder="At least 8 characters"
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {errorMessage}
        </div>
      ) : null}

      {infoMessage ? (
        <div className="rounded-lg border border-[var(--ok)]/40 bg-[var(--ok)]/10 px-3 py-2 text-sm text-[var(--ok)]">
          {infoMessage}
        </div>
      ) : null}

      <Button className="w-full" disabled={isSubmitting} onClick={onSubmit} tone="primary" type="button">
        {isSubmitting
          ? "Working..."
          : mode === "signin"
            ? "Sign In"
            : "Create Account"}
      </Button>
    </Panel>
  );
};
