import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { ProjectWorkspace } from "@/components/projects/ProjectWorkspace";
import type { ProjectPage } from "@/lib/project-types";
import { listOwnedProjects } from "@/server/projects";

export const runtime = "nodejs";

export const metadata = {
  title: "Your projects — Trace",
};

export default async function ProjectsPage() {
  // obtain the userId from the auth object
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    return null;
  }

  // fetch the initial page of projects for the user using userId
  let initialPage: ProjectPage = { items: [], nextCursor: null };
  let loadError = false;
  try {
    initialPage = await listOwnedProjects(userId, 20, null);
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-20 pt-8 sm:px-10">
      <a
        href="#workspace-content"
        className="sr-only rounded-md bg-lime-300 px-3 py-2 font-medium text-zinc-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Skip to projects
      </a>
      <header className="flex items-center justify-between border-b border-white/10 pb-6">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300">
          <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-sm font-black text-zinc-950">
            T
          </span>
          Trace
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-zinc-400 sm:block">Signed in</span>
          <span className="inline-flex rounded-full focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-lime-300">
            <UserButton />
          </span>
        </div>
      </header>

      <section id="workspace-content" tabIndex={-1} className="flex flex-1 flex-col justify-center py-16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-lime-300">
          Your workspace
        </p>
        <h1 className="mb-10 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Keep every project in view.
        </h1>
        <ProjectWorkspace initialPage={initialPage} loadError={loadError} />
      </section>
      <SiteFooter />
    </main>
  );
}
