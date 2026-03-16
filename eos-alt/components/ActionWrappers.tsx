"use client";

import { toast } from "sonner";
import { useTransition } from "react";

interface ActionFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  actionFunc: (formData: FormData) => Promise<void>;
  successMessage: string;
  errorMessage: string;
  children: React.ReactNode;
}

export function ActionForm({ actionFunc, successMessage, errorMessage, children, ...props }: ActionFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await actionFunc(formData);
        toast.success(successMessage);
      } catch (err: any) {
        toast.error(errorMessage, {
          description: err.message || "An unknown error occurred.",
        });
      }
    });
  };

  return (
    <form action={handleSubmit} {...props}>
      {children}
    </form>
  );
}

interface DeleteButtonProps {
  actionFunc: () => Promise<void>;
}

export function DeleteButton({ actionFunc }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await actionFunc();
        toast.success("Beacon Purged");
      } catch (err: any) {
        toast.error("Purge Failed", {
          description: err.message || "An unknown error occurred.",
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-500 hover:text-red-400 font-mono text-xs uppercase underline disabled:opacity-50"
    >
      {isPending ? "[Purging...]" : "[Purge]"}
    </button>
  );
}
