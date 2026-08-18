import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900"
    >
      <ArrowLeftIcon aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
}
