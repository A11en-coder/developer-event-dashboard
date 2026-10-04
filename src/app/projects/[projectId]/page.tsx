import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import type { ActivitySnapshot } from "@/lib/activity-types";
import { ProjectActivity } from "@/components/projects/ProjectActivity";
import { ProjectKeyManagement } from "@/components/projects/ProjectKeyManagement";
import { getOwnedActivitySnapshot } from "@/server/activity";
import { getOwnedProject } from "@/server/projects";

export const runtime = "nodejs";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    return null;
  }

  const { projectId } = await params;
  let project;
  try {
    project = await getOwnedProject(userId, projectId);
  } catch {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-20 pt-8 sm:px-10">
        <a
          href="#workspace-content"
          className="sr-only rounded-md bg-lime-300 px-3 py-2 font-medium text-zinc-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Skip to project details
        </a>
        <WorkspaceHeader />
        <section id="workspace-content" tabIndex={-1} className="flex flex-1 flex-col justify-center py-16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300">Project</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Project data is temporarily unavailable.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Refresh this page in a moment. If the issue continues, contact support.</p>
          <Link href="/projects" className="mt-7 inline-flex min-h-11 w-fit items-center rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">Back to projects</Link>
        </section>
      </main>
    );
  }

  if (!project) {
    notFound();
  }

  let activity: ActivitySnapshot | null = null;
  let activityUnavailable = false;
  try {
    activity = await getOwnedActivitySnapshot(userId, projectId);
  } catch {
    activityUnavailable = true;
  }

  if (!activity && !activityUnavailable) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-20 pt-8 sm:px-10">
      <a
        href="#workspace-content"
        className="sr-only rounded-md bg-lime-300 px-3 py-2 font-medium text-zinc-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Skip to project details
      </a>
      <WorkspaceHeader />
      <section id="workspace-content" tabIndex={-1} className="flex flex-1 flex-col py-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300 sm:py-16">
        <Link href="/projects" className="mb-8 inline-flex min-h-11 w-fit items-center pr-3 text-sm text-zinc-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">← All projects</Link>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300">Selected project</p>
        <h1 className="mt-3 break-words text-4xl font-semibold tracking-tight text-white sm:text-5xl">{project.name}</h1>
        <p className="mt-4 text-sm text-zinc-400">Created {project.createdAt.slice(0, 10)}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <ProjectKeyManagement
            key={project.keyVersion}
            projectId={project.id}
            keyVersion={project.keyVersion}
            activeKey={project.activeKey}
          />
        </div>
        <div className="mt-8">
          <ProjectActivity snapshot={activity} unavailable={activityUnavailable} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function WorkspaceHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 pb-6">
      <Link href="/projects" className="flex items-center gap-3 font-semibold tracking-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300">
        <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-sm font-black text-zinc-950">T</span>
        Trace
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/projects" className="inline-flex min-h-11 items-center px-2 text-sm text-zinc-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">Projects</Link>
        <span className="inline-flex rounded-full focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-lime-300">
          <UserButton />
        </span>
      </div>
    </header>
  );
}
