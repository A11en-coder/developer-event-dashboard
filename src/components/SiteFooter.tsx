import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-zinc-400">
        Trace is a portfolio demonstration. Send named events only; do not
        include personal information.
      </p>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/api-guide" className="inline-flex min-h-11 items-center py-2 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">
          API guide
        </Link>
        <Link href="/privacy" className="inline-flex min-h-11 items-center py-2 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">
          Privacy
        </Link>
        <Link href="/support" className="inline-flex min-h-11 items-center py-2 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">
          Support
        </Link>
      </nav>
    </footer>
  );
}
