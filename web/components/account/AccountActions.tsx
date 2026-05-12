"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction, signOutAction } from "@/app/account/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
      className="w-full rounded-lg border border-white/10 bg-white/5 text-floodlight font-semibold py-3 hover:bg-white/10 disabled:opacity-50 transition-colors"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-red-400 underline hover:text-red-300"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-3">
      <p className="text-sm text-slate-300 leading-relaxed">
        This permanently removes your Football IQ account and unlinks any
        active subscription. Your local game history will stay on this device.
      </p>
      {error ? (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                setError(null);
                await deleteAccountAction();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Failed to delete account",
                );
              }
            })
          }
          className="flex-1 rounded-lg bg-red-500 text-white font-semibold py-2 text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {pending ? "Deleting…" : "Yes, delete forever"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 text-floodlight font-semibold py-2 text-sm hover:bg-white/10 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
