import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-20 sm:px-8 lg:px-12">
      <header className="flex h-20 items-center justify-between border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-sm font-black text-zinc-950">T</span>
          Trace
          <span className="hidden rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400 lg:inline-flex">Developer event dashboard</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-3">
          <Link href="/api-guide" className="hidden min-h-11 items-center whitespace-nowrap px-3 py-2 text-sm text-zinc-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 sm:inline-flex">API guide</Link>
          <Link href="#how-it-works" className="hidden min-h-11 items-center whitespace-nowrap px-3 py-2 text-sm text-zinc-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 sm:inline-flex">How it works</Link>
          <Link href="/sign-in" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 sm:px-3">Sign in</Link>
          <Link href="/sign-up" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg bg-lime-300 px-3 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 sm:px-4">Create account <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className="grid min-h-[660px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/[0.06] px-3 py-1.5 text-xs font-medium text-lime-200"><span className="size-1.5 rounded-full bg-lime-300" /> A clearer view of your event API</div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">Know what your API <span className="text-lime-300">actually received.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">Send a named event from your backend. See the event and whether the request made it through, together in one simple project dashboard.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-lime-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">Get started <span aria-hidden="true">→</span></Link>
            <Link href="/api-guide" className="inline-flex h-12 items-center justify-center rounded-lg border border-white/12 px-5 text-sm font-medium text-zinc-300 transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">Read the API guide</Link>
          </div>
          <p className="mt-5 text-xs text-zinc-400">Free portfolio demonstration · Built for backend events</p>
        </div>

        <div aria-label="Example event activity preview" className="relative overflow-x-clip">
          <div className="absolute -inset-10 bg-lime-300/[0.04] blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101211] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <div><p className="text-xs text-zinc-400">PROJECT /</p><p className="mt-1 text-sm font-medium text-white">checkout-service</p></div>
              <span className="rounded-md border border-lime-300/15 bg-lime-300/[0.07] px-2.5 py-1 text-[10px] font-medium text-lime-200">LAST 30 DAYS</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-white/[0.07] border-b border-white/[0.07]">
              {[["EVENTS", "1,284"], ["ACCEPTED", "1,261"], ["REJECTED", "23"]].map(([label, value]) => (
                <div key={label} className="px-4 py-5 sm:px-6 sm:py-6"><p className="text-[9px] font-medium tracking-[0.14em] text-zinc-400 sm:text-[10px]">{label}</p><p className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">{value}</p></div>
              ))}
            </div>
            <div className="px-5 py-5 sm:px-6">
              <div className="mb-4 flex items-center justify-between"><p className="text-xs font-medium text-zinc-300">Recent requests</p><span className="text-[10px] text-zinc-400">just now</span></div>
              <div className="space-y-1">
                {[["checkout_completed", "201", "11:42:08"], ["cart_updated", "201", "11:41:51"], ["checkout_completed", "400", "11:39:16"]].map(([name, status, time]) => (
                  <div key={time} className="flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-white/[0.025]">
                    <span className={"size-1.5 rounded-full " + (status === "201" ? "bg-lime-300" : "bg-amber-400")} />
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-300 sm:text-xs">{name}</span>
                    <span className={"font-mono text-[10px] " + (status === "201" ? "text-lime-300" : "text-amber-300")}>{status}</span>
                    <span className="font-mono text-[10px] text-zinc-400">{time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-white/[0.07] px-5 py-3 text-[10px] text-zinc-400 sm:px-6"><span className="size-1.5 rounded-full bg-lime-300" /> Example preview · your project data stays yours</div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-white/10 py-16 sm:py-20">
        <div className="mb-10 max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">A simple first step</p><h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">From first request to clear answer.</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[["01", "Create your account", "Sign in and keep your projects in a workspace tied to your account."], ["02", "Send a backend event", "Use a project key to submit a named event from your server."], ["03", "See what happened", "Check accepted events alongside the outcome of each API request."]].map(([number, title, description]) => (
            <article key={number} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6"><p className="font-mono text-xs text-lime-300">{number}</p><h3 className="mt-5 font-medium text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p></article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
