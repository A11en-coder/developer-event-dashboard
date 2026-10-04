import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Support — Trace",
  description: "Get help with Trace and request project-data removal.",
};

function getSupportDestination(): URL | null {
  const configuredUrl = process.env.SUPPORT_URL?.trim();
  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);
    if (url.protocol === "https:" && !url.username && !url.password) {
      return url;
    }
    if (
      url.protocol === "mailto:" &&
      /^[^@\s]+@[^@\s]+$/.test(url.pathname)
    ) {
      return url;
    }
  } catch {
    return null;
  }

  return null;
}

export default async function SupportPage() {
  await connection();
  const destination = getSupportDestination();
  const isEmail = destination?.protocol === "mailto:";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-12 sm:px-8 lg:px-12">
      <header className="flex h-20 items-center justify-between border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-sm font-black text-zinc-950">
            T
          </span>
          Trace
        </Link>
        <Link href="/privacy" className="text-sm text-zinc-400 transition hover:text-white">
          Privacy
        </Link>
      </header>

      <section className="max-w-2xl flex-1 py-14 sm:py-18">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
          Support
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          How can we help?
        </h1>
        <p className="mt-5 text-sm leading-7 text-zinc-400">
          For event-format and API-response questions, start with the API guide.
          You can also use the support channel below to report an issue or
          request operator-assisted project-data removal.
        </p>

        {destination ? (
          <a
            href={destination.href}
            className="mt-8 inline-flex rounded-lg bg-lime-300 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
          >
            {isEmail ? "Email support" : "Open support channel"}
          </a>
        ) : (
          <p className="mt-8 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-sm leading-6 text-amber-100/80">
            A support destination is not configured for this deployment yet.
            For API usage guidance, see the{" "}
            <Link href="/api-guide" className="underline underline-offset-4">
              API guide
            </Link>
            .
          </p>
        )}

        <p className="mt-8 text-sm leading-7 text-zinc-500">
          Do not include API keys, passwords, or personal information in a
          support request. If you need project data removed, identify the
          account and project without sending a secret key.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
