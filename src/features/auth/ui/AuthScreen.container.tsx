"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared";
import { AuthScreen } from "./AuthScreen.presentational";

type AuthMode = "signin" | "signup";

export const AuthScreenContainer = () => {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!supabase) {
      setErrorMessage("Supabase env variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      return;
    }

    if (email.trim().length === 0) {
      setErrorMessage("Email is required.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        router.replace("/");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace("/");
        router.refresh();
        return;
      }

      setInfoMessage("Account created. If email confirmation is enabled, confirm your email before signing in.");
      setMode("signin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen
      email={email}
      errorMessage={errorMessage}
      infoMessage={infoMessage}
      isSubmitting={isSubmitting}
      mode={mode}
      password={password}
      onEmailChange={setEmail}
      onModeChange={setMode}
      onPasswordChange={setPassword}
      onSubmit={onSubmit}
    />
  );
};
