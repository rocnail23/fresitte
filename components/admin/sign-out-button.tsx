"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2 text-muted-foreground"
      disabled={pending}
      onClick={() => startTransition(() => signOut({ callbackUrl: "/login" }))}
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Saliendo…" : "Salir"}
    </Button>
  );
}
