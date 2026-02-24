import { Button, Card, CardContent, Input } from "@/shared";

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
    <Card className="mx-auto w-full max-w-md border-border bg-card/90">
      <CardContent className="space-y-5 p-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Callhalla Access</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to use the request console. Registration is enabled for now and can be disabled later in Supabase.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => onModeChange("signin")}
          type="button"
          variant={mode === "signin" ? "default" : "secondary"}
        >
          Sign In
        </Button>
        <Button
          onClick={() => onModeChange("signup")}
          type="button"
          variant={mode === "signup" ? "default" : "secondary"}
        >
          Sign Up
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="email">
            Email
          </label>
          <Input
            autoComplete="email"
            id="email"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="password">
            Password
          </label>
          <Input
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
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {infoMessage ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          {infoMessage}
        </div>
      ) : null}

      <Button className="w-full" disabled={isSubmitting} onClick={onSubmit} type="button">
        {isSubmitting
          ? "Working..."
          : mode === "signin"
            ? "Sign In"
            : "Create Account"}
      </Button>
      </CardContent>
    </Card>
  );
};
