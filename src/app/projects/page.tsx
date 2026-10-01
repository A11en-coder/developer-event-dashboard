import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
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
        <h1 className="mb-10 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Keep every project in view.
        </h1>
        <ProjectWorkspace initialPage={initialPage} loadError={loadError} />
      </section>
    </main>
  );
}
