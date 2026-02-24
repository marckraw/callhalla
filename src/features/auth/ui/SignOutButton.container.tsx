"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, createSupabaseBrowserClient } from "@/shared";

export const SignOutButton = () => {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    setIsSubmitting(true);
    try {
      await supabase.auth.signOut();
      router.replace("/auth");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button disabled={isSubmitting} onClick={handleSignOut} type="button">
      {isSubmitting ? "Signing out..." : "Sign Out"}
    </Button>
  );
};
