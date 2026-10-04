"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ProjectPage, ProjectSummary } from "@/lib/project-types";

type ProjectWorkspaceProps = {
  initialPage: ProjectPage;
  loadError: boolean;
};

export function ProjectWorkspace({
  initialPage,
  loadError,
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  async function refreshFirstPage(): Promise<boolean> {
    try {
      const response = await fetch("/api/projects?limit=20", {
        cache: "no-store",
      });
      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      setProjects(result.items);
      setNextCursor(result.nextCursor);
      return true;
    } catch {
      return false;
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();

      if (!response.ok) {
        const listRefreshed =
          response.status >= 500 ? await refreshFirstPage() : false;
        setError(
          response.status >= 500
            ? listRefreshed
              ? "We couldn’t confirm whether the project was created. Check the refreshed list before trying again."
              : "We couldn’t confirm whether the project was created. Refresh the list before trying again."
            : result?.error?.message ?? "Project creation could not be completed.",
        );
        return;
      }

      const project = result.project as ProjectSummary;
      router.push("/projects/" + encodeURIComponent(project.id));
    } catch {
      const listRefreshed = await refreshFirstPage();
      setError(
        listRefreshed
          ? "We couldn’t confirm whether the project was created. Check the refreshed list before trying again."
          : "We couldn’t confirm whether the project was created. Refresh the list before trying again.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const response = await fetch(
        "/api/projects?limit=20&cursor=" + encodeURIComponent(nextCursor),
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) {
        setLoadMoreError(
          result?.error?.message ?? "The next project page could not be loaded.",
        );
        return;
      }

      setProjects((current) => [...current, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch {
      setLoadMoreError("The next project page could not be loaded. Try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby="projects-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="projects-heading" className="text-lg font-semibold text-white">
              Projects
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Each project has its own events and API key.
            </p>
          </div>
          <span className="shrink-0 text-xs text-zinc-400">Most recent first</span>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-5 text-sm leading-6 text-amber-100">
            Your project list is temporarily unavailable. Refresh the page in a
            moment.
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 sm:p-8">
            <p className="font-medium text-white">No projects yet</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Create your first project to give your events a home.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={"/projects/" + encodeURIComponent(project.id)}
                  className="group flex min-h-11 items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-lime-300/30 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-lime-200">
                      {project.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-white">
                        {project.name}
                      </span>
                      <span className="mt-1 block text-xs text-zinc-400">
                        Created {project.createdAt.slice(0, 10)}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-zinc-500 transition group-hover:text-lime-200" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {nextCursor && !loadError && (
          <div className="mt-4">
            {loadMoreError && (
              <p role="alert" className="mb-3 text-sm text-amber-200">
                {loadMoreError}
              </p>
            )}
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:cursor-wait disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more projects"}
            </button>
          </div>
        )}
      </section>

      <aside className="h-fit rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
        <h2 className="font-semibold text-white">Create a project</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Choose a name that helps you recognize the app or service.
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleCreate}>
          <div>
            <label htmlFor="project-name" className="mb-2 block text-sm font-medium text-zinc-300">
              Project name
            </label>
            <input
              id="project-name"
              name="name"
              autoComplete="off"
              required
              aria-describedby="project-name-hint"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. My Website"
              className="h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white transition placeholder:text-zinc-600 focus:border-lime-300/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
            />
            <p id="project-name-hint" className="mt-2 text-xs text-zinc-400">1–80 characters after trimming.</p>
          </div>
          {error && (
            <p role="alert" className="text-sm leading-5 text-amber-200">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-lime-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create project"}
          </button>
          <p role="status" className="sr-only">
            {creating ? "Creating project." : ""}
          </p>
        </form>
        <p className="mt-4 text-xs leading-5 text-zinc-400">
          Project names can’t be edited or deleted in this early version.
        </p>
      </aside>
    </div>
  );
}
