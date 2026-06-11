"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteUserAsAdmin } from "@/app/admin/users/actions";

interface DeleteUserButtonProps {
  userId: string;
  userLabel: string;
}

export default function DeleteUserButton({ userId, userLabel }: DeleteUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUserAsAdmin(userId);

      if (!result.ok) {
        toast.error("User deletion failed", { description: result.error });
        return;
      }

      setIsOpen(false);
      toast.success("User removed", {
        description: `${userLabel} and their user-owned records were permanently deleted.`,
      });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Remove user
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-user-${userId}`}
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-panel p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Permanent deletion
                </p>
                <h2
                  id={`delete-user-${userId}`}
                  className="mt-1 text-lg font-bold text-foreground [overflow-wrap:anywhere]"
                >
                  Remove {userLabel}?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                aria-label="Close deletion confirmation"
                className="rounded-md p-2 text-foreground/50 transition hover:bg-background hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-foreground/65">
              This permanently removes the Supabase Auth account and cascading
              user-owned records, including saved locations, notifications,
              emergency contacts, SOS requests, and simulation data.
            </p>
            <p className="mt-3 break-all rounded-md border border-border bg-background p-3 text-xs text-foreground/55">
              User ID: {userId}
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="min-h-10 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {isPending ? "Removing..." : "Permanently remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

