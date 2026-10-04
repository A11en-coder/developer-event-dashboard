import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Trace is a portfolio demonstration. Send named events only; do not
        include personal information.
      </p>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/api-guide" className="transition hover:text-white">
          API guide
        </Link>
        <Link href="/privacy" className="transition hover:text-white">
          Privacy
        </Link>
        <Link href="/support" className="transition hover:text-white">
          Support
        </Link>
      </nav>
    </footer>
  );
}
