"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

/** Submit button that reports pending state — every form gets one. */
export function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? (pendingLabel ?? "Saving…") : label}
    </button>
  );
}

export function CancelLink({ href }: { href: string }) {
  return (
    <Link href={href} className="btn btn-ghost">
      Cancel
    </Link>
  );
}

/** Destructive action, guarded by a confirm so a stray click can't wipe a record. */
export function DeleteButton({
  action,
  label = "Delete",
  confirmText,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <DeleteSubmit label={label} />
    </form>
  );
}

function DeleteSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-danger" disabled={pending}>
      {pending ? "Deleting…" : label}
    </button>
  );
}
