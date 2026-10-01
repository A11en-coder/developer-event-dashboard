import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectKeyManagement } from "@/components/projects/ProjectKeyManagement";
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
        <WorkspaceHeader />
        <section className="flex flex-1 flex-col justify-center py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300">Project</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Project data is temporarily unavailable.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Refresh this page in a moment. If the issue continues, check that the project database migration has been applied.</p>
          <Link href="/projects" className="mt-7 w-fit rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/25 hover:text-white">Back to projects</Link>
        </section>
      </main>
    );
  }

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-20 pt-8 sm:px-10">
      <WorkspaceHeader />
      <section className="flex flex-1 flex-col py-12 sm:py-16">
        <Link href="/projects" className="mb-8 w-fit text-sm text-zinc-500 transition hover:text-white">← All projects</Link>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300">Selected project</p>
        <h1 className="mt-3 break-words text-4xl font-semibold tracking-tight text-white sm:text-5xl">{project.name}</h1>
        <p className="mt-4 text-sm text-zinc-500">Created {project.createdAt.slice(0, 10)}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <ProjectKeyManagement
            key={project.keyVersion}
            projectId={project.id}
            keyVersion={project.keyVersion}
            activeKey={project.activeKey}
          />
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Activity</p>
            <p className="mt-4 text-sm leading-6 text-zinc-400">Event and request activity will appear here after ingestion is implemented.</p>
          </section>
        </div>
      </section>
    </main>
  );
}

function WorkspaceHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 pb-6">
      <Link href="/projects" className="flex items-center gap-3 font-semibold tracking-tight text-white">
        <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-sm font-black text-zinc-950">T</span>
        Trace
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/projects" className="text-sm text-zinc-400 transition hover:text-white">Projects</Link>
        <UserButton />
      </div>
    </header>
  );
}
