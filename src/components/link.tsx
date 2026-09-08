"use client";

import NextLink, { useLinkStatus } from "next/link";
import { useProgressWhile } from "./progress";

/** Reports its link's navigation to the top bar, and draws nothing itself. */
function PendingReporter() {
  const { pending } = useLinkStatus();
  useProgressWhile(pending);
  return null;
}

/**
 * `next/link`, with the top progress bar wired in. A drop-in replacement:
 * everything `next/link` takes, this takes too.
 */
export function Link({
  children,
  ...props
}: React.ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props}>
      {children}
      <PendingReporter />
    </NextLink>
  );
}
