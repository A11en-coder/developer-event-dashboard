"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProjectDetail } from "@/lib/project-types";

type ProjectKeyManagementProps = {
  projectId: string;
  keyVersion: number;
  activeKey: ProjectDetail["activeKey"];
};

type KeyAction = "issue" | "revoke" | "replace";
type OneTimeProjectKey = NonNullable<ProjectDetail["activeKey"]> & {
  value: string;
};

export function ProjectKeyManagement({
  projectId,
  keyVersion: initialKeyVersion,
  activeKey: initialActiveKey,
}: ProjectKeyManagementProps) {
  const router = useRouter();
  const [keyVersion, setKeyVersion] = useState(initialKeyVersion);
  const [activeKey, setActiveKey] = useState(initialActiveKey);
  const [oneTimeKey, setOneTimeKey] = useState<OneTimeProjectKey | null>(null);
  const [confirming, setConfirming] = useState<"revoke" | "replace" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<string | null>(null);

  async function performAction(action: KeyAction) {
    setBusy(true);
    setError(null);
    setCopyState(null);

    const path =
      action === "revoke"
        ? `/api/projects/${encodeURIComponent(projectId)}/keys/${encodeURIComponent(activeKey?.id ?? "")}`
        : action === "replace"
          ? `/api/projects/${encodeURIComponent(projectId)}/keys/replace`
          : `/api/projects/${encodeURIComponent(projectId)}/keys`;
    const method = action === "revoke" ? "DELETE" : "POST";
    const body =
      action === "issue"
        ? { expectedKeyVersion: keyVersion }
        : { expectedKeyVersion: keyVersion, confirmed: true };

    try {
      const response = await fetch(path, {
        method,
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const responseBody = result as {
          error?: { message?: string };
        };
        setError(
          responseBody?.error?.message ?? "The key change could not be completed.",
        );
        if (response.status === 409) {
          router.refresh();
        }
        return;
      }

      const responseBody = result as {
        key?: OneTimeProjectKey;
        keyVersion: number;
      };
      setKeyVersion(responseBody.keyVersion);
      setConfirming(null);

      if (action === "revoke") {
        setActiveKey(null);
        setOneTimeKey(null);
        router.refresh();
        return;
      }

      const key = responseBody.key;
      if (!key?.value || !key.id || !key.displayHint || !key.createdAt) {
        setError(
          "The key change succeeded, but its one-time secret could not be confirmed. Refresh the page and replace the key if needed.",
        );
        setOneTimeKey(null);
        router.refresh();
        return;
      }

      setActiveKey({
        id: key.id,
        displayHint: key.displayHint,
        createdAt: key.createdAt,
      });
      setOneTimeKey(key);
    } catch {
      setError(
        "We couldn’t confirm whether the key changed. Refresh the project before trying again; a lost key secret cannot be recovered.",
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copyKey() {
    if (!oneTimeKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(oneTimeKey.value);
      setCopyState("Key copied.");
    } catch {
      setCopyState("Copy failed. Select and copy the key manually.");
    }
  }

  function dismissOneTimeKey() {
    setOneTimeKey(null);
    setCopyState(null);
    router.refresh();
  }

  return (
    <section
      aria-labelledby="project-key-heading"
      className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6"
    >
      <p role="status" className="sr-only">
        {busy ? "Processing API key change." : ""}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Project credential
          </p>
          <h2 id="project-key-heading" className="mt-2 font-semibold text-white">
            API key
          </h2>
        </div>
        {activeKey && !oneTimeKey && (
          <span className="rounded-full border border-lime-300/20 bg-lime-300/[0.06] px-2.5 py-1 text-xs text-lime-200">
            Active
          </span>
        )}
      </div>

      {oneTimeKey ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.05] p-4">
            <p className="font-medium text-amber-100">Copy and save this key now</p>
            <p className="mt-1 text-sm leading-5 text-amber-100/70">
              The full key is shown once. It cannot be retrieved after you close this panel.
            </p>
          </div>
          <code className="block select-all break-all rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-sm text-zinc-100">
            {oneTimeKey.value}
          </code>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyKey}
              className="inline-flex min-h-11 items-center rounded-lg bg-lime-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
            >
              Copy key
            </button>
            <button
              type="button"
              onClick={dismissOneTimeKey}
              className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
            >
              I’ve saved it — close
            </button>
            {copyState && <p role="status" className="text-sm text-zinc-400">{copyState}</p>}
          </div>
        </div>
      ) : activeKey ? (
        <div className="mt-5">
          <p className="font-mono text-sm text-zinc-200">{activeKey.displayHint}</p>
          <p className="mt-2 text-xs text-zinc-400">
            Created {activeKey.createdAt.slice(0, 10)}. The full secret is not stored and cannot be shown again.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming("replace")}
              className="inline-flex min-h-11 items-center rounded-lg border border-amber-300/20 px-4 py-2.5 text-sm text-amber-100 transition hover:border-amber-300/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:cursor-wait disabled:opacity-50"
            >
              Replace key
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming("revoke")}
              className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:cursor-wait disabled:opacity-50"
            >
              Revoke key
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm leading-6 text-zinc-400">
            No active key yet. Issue one to let your backend send events for this project.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void performAction("issue")}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-lime-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:cursor-wait disabled:opacity-50"
          >
            {busy ? "Creating key…" : "Create API key"}
          </button>
        </div>
      )}

      {confirming && !oneTimeKey && (
        <section
          aria-labelledby="key-confirmation-heading"
          className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/[0.05] p-4"
        >
          <h3 id="key-confirmation-heading" className="font-medium text-amber-100">
            {confirming === "replace" ? "Replace the active key?" : "Revoke the active key?"}
          </h3>
          <p className="mt-2 text-sm leading-5 text-amber-100/70">
            {confirming === "replace"
              ? "The current key will stop authorizing new requests as soon as replacement succeeds. The new secret will only be shown once."
              : "The current key will stop authorizing new requests as soon as revocation succeeds. This cannot be undone."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void performAction(confirming)}
              className="inline-flex min-h-11 items-center rounded-lg bg-amber-200 px-4 py-2 text-sm font-semibold text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
            >
              {busy ? "Saving…" : confirming === "replace" ? "Confirm replacement" : "Confirm revocation"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming(null)}
              className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {error && <p role="alert" className="mt-4 text-sm leading-5 text-amber-200">{error}</p>}
    </section>
  );
}
