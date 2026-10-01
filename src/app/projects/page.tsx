import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export const metadata = {
  title: "Your projects — Trace",
};

export default async function ProjectsPage() {
  await auth.protect();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-20 pt-8 sm:px-10">
      <header className="flex items-center justify-between border-b border-white/10 pb-6">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-sm font-black text-zinc-950">
            T
          </span>
          Trace
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-zinc-500 sm:block">Signed in</span>
          <UserButton />
        </div>
      </header>

      <section className="flex flex-1 flex-col justify-center py-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-lime-300">
          Your workspace
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Your projects will live here.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
          Your account is ready. Project creation and event activity are coming in
          the next implementation step.
        </p>
        <div className="mt-10 max-w-2xl rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-lime-300" aria-hidden="true">
              ◇
            </span>
            <div>
              <h2 className="font-medium text-white">Workspace secured</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                This page is available to the signed-in account only. Your account
                identifier is ready to scope projects to you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
