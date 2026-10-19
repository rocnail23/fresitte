"use client";

import { useTransition } from "react";
import { Loader2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteDialogProps {
  entityName: string;
  entityLabel: string;
  description?: string;
  trigger?: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Generic confirmation dialog for destructive actions. The actual
 * mutation is invoked via `onConfirm` (typically a server action).
 */
export function ConfirmDeleteDialog({
  entityName,
  entityLabel,
  description = "Esta acción no se puede deshacer.",
  trigger,
  onConfirm,
  open,
  onOpenChange,
}: ConfirmDeleteDialogProps) {
  const [pending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      await onConfirm();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </AlertDialogMedia>
          <AlertDialogTitle>{`Eliminar ${entityLabel.toLowerCase()}`}</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar <strong>{entityName}</strong>. {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              run();
            }}
            disabled={pending}
            variant="destructive"
          >
            {pending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Eliminando…
              </>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
