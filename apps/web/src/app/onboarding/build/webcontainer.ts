/**
 * WebContainer integration for the vibr build page.
 *
 * This module lazily boots a StackBlitz WebContainer (in-browser
 * Node sandbox) so the user can run, install, and preview the
 * project they're generating without ever leaving the browser. It's
 * what makes vibr feel like Bolt / Lovable / Replit Agent instead
 * of a glorified code notepad.
 *
 * Key facts about WebContainer that shape this module:
 *   - `WebContainer.boot()` can only be called ONCE per page load.
 *     We enforce this with a module-level singleton.
 *   - The container requires a cross-origin-isolated context. See
 *     apps/web/next.config.mjs — we set COEP: credentialless and
 *     COOP: same-origin on /onboarding/build only.
 *   - Files are written via `container.fs.writeFile(path, contents)`
 *     with string data. Directories are created implicitly.
 *   - `container.spawn("npm", ["install"])` returns a process whose
 *     output stream we pipe into a terminal buffer.
 *   - The container emits a "server-ready" event when the dev server
 *     starts listening on a port. We capture the URL and pass it to
 *     the iframe so the preview pane shows the live app.
 *
 * Everything here is browser-only. If this module is imported from a
 * server component or during SSR, `typeof window === "undefined"` and
 * the exports become safe no-ops.
 */

import type {
  WebContainer as WebContainerType,
  WebContainerProcess,
} from "@webcontainer/api";

type Status =
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "running"
  | "ready"
  | "error";

interface State {
  container: WebContainerType | null;
  status: Status;
  statusMessage: string;
  previewUrl: string | null;
  terminal: string[];
  devProcess: WebContainerProcess | null;
}

const state: State = {
  container: null,
  status: "idle",
  statusMessage: "",
  previewUrl: null,
  terminal: [],
  devProcess: null,
};

const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

function setStatus(status: Status, message = "") {
  state.status = status;
  state.statusMessage = message;
  notify();
}

function pushTerminal(line: string) {
  // Keep the last 500 lines so the terminal doesn't grow unbounded.
  state.terminal.push(line);
  if (state.terminal.length > 500) {
    state.terminal = state.terminal.slice(-500);
  }
  notify();
}

/** Subscribe to state changes. Returns an unsubscribe function. */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Read-only view of the current state for useSyncExternalStore. */
export function getSnapshot(): Readonly<State> {
  return state;
}

/** SSR-safe snapshot: WebContainer can never boot during SSR, so we
 *  return a fresh idle object to avoid hydration mismatches on a
 *  shared module-level state. */
export function getServerSnapshot(): Readonly<State> {
  return {
    container: null,
    status: "idle",
    statusMessage: "",
    previewUrl: null,
    terminal: [],
    devProcess: null,
  };
}

/**
 * Boot the WebContainer singleton. Safe to call multiple times — the
 * second call returns the same instance. Throws if the browser isn't
 * cross-origin isolated (i.e. the headers in next.config.mjs didn't
 * get applied for whatever reason).
 */
async function getOrBootContainer(): Promise<WebContainerType> {
  if (state.container) return state.container;
  if (typeof window === "undefined") {
    throw new Error("WebContainer can only run in the browser.");
  }
  if (typeof (globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated !== "undefined") {
    // crossOriginIsolated is a boolean global set by the browser when
    // COEP/COOP headers are present. If it's missing or false, the
    // boot call will throw with a confusing message, so we give a
    // more actionable one up front.
    if (!(globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated) {
      throw new Error(
        "Browser is not cross-origin isolated. Reload the page — the COEP/COOP headers on /onboarding/build should have applied. If the error persists, your browser may not support WebContainers (use Chrome, Edge, or Brave)."
      );
    }
  }

  setStatus("booting", "Booting in-browser Node sandbox\u2026");
  // Dynamic import so the 2MB WebContainer bundle isn't pulled into
  // the initial page load for users who never click "Start preview".
  const { WebContainer } = await import("@webcontainer/api");
  try {
    const container = await WebContainer.boot();
    state.container = container;

    // Listen for the dev server coming up.
    container.on("server-ready", (port, url) => {
      state.previewUrl = url;
      setStatus("ready", `Dev server listening on port ${port}`);
    });
    container.on("error", (err) => {
      pushTerminal(`[webcontainer error] ${err.message}`);
      setStatus("error", err.message);
    });

    return container;
  } catch (err) {
    setStatus(
      "error",
      err instanceof Error ? err.message : "Failed to boot WebContainer"
    );
    throw err;
  }
}

/**
 * Start the full flow: boot → mount files → npm install → npm run dev.
 * Called from the preview panel's "Start preview" button.
 */
export async function startPreview(
  files: { path: string; content: string }[]
): Promise<void> {
  try {
    const container = await getOrBootContainer();

    // Mount files. WebContainer wants a FileSystemTree — a nested
    // object — but writeFile on each path is equivalent and way
    // simpler for our case.
    setStatus("mounting", `Copying ${files.length} file(s) to the sandbox\u2026`);
    for (const f of files) {
      await ensureDirsAndWrite(container, f.path, f.content);
    }

    // If there's no package.json yet, seed a minimal one so `npm run
    // dev` at least has a chance of working. Most vibr-generated
    // projects will have their own, but user-imported folders
    // sometimes won't.
    const hasPkgJson = files.some((f) => f.path === "package.json");
    if (!hasPkgJson) {
      pushTerminal("No package.json found — skipping install + dev.");
      setStatus("error", "No package.json found in the project folder.");
      return;
    }

    // npm install
    setStatus("installing", "Running npm install\u2026");
    pushTerminal("$ npm install");
    const install = await container.spawn("npm", ["install"]);
    install.output.pipeTo(
      new WritableStream({
        write(chunk) {
          pushTerminal(chunk);
        },
      })
    );
    const installExit = await install.exit;
    if (installExit !== 0) {
      setStatus("error", `npm install failed with exit code ${installExit}`);
      return;
    }

    // npm run dev (or start) — we prefer `dev` since vibr defaults to
    // Next.js, which uses `next dev`. Fall back to `start` if `dev`
    // isn't defined in package.json.
    const scriptToRun = await pickRunScript(container);
    if (!scriptToRun) {
      setStatus(
        "error",
        "package.json has no dev or start script to run."
      );
      return;
    }

    setStatus("running", `Running npm run ${scriptToRun}\u2026`);
    pushTerminal(`$ npm run ${scriptToRun}`);
    const dev = await container.spawn("npm", ["run", scriptToRun]);
    state.devProcess = dev;
    dev.output.pipeTo(
      new WritableStream({
        write(chunk) {
          pushTerminal(chunk);
        },
      })
    );
    // We don't await dev.exit — the dev server is meant to stay up
    // until the user stops it or the page unloads.
  } catch (err) {
    setStatus(
      "error",
      err instanceof Error ? err.message : "Preview failed"
    );
    pushTerminal(
      `[error] ${err instanceof Error ? err.message : "unknown"}`
    );
  }
}

/** Kill the dev process and reset state, but keep the booted
 *  container alive (you can't reboot one per page load). */
export async function stopPreview(): Promise<void> {
  try {
    if (state.devProcess) {
      state.devProcess.kill();
      state.devProcess = null;
    }
    state.previewUrl = null;
    setStatus("idle", "Preview stopped.");
  } catch (err) {
    pushTerminal(
      `[stop error] ${err instanceof Error ? err.message : "unknown"}`
    );
  }
}

/** Mirror a single file write into the sandbox. Called by the build
 *  page's diff-apply handler after vibr writes to disk, so the
 *  preview stays in sync without a full re-mount. No-op if the
 *  container hasn't been booted yet. */
export async function syncWrite(
  path: string,
  content: string
): Promise<void> {
  if (!state.container) return;
  try {
    await ensureDirsAndWrite(state.container, path, content);
  } catch {
    /* ignore */
  }
}

/** Re-pipe the dev process output into the terminal after it's been
 *  started. Useful after `restartDev`. */
export async function restartDev(): Promise<void> {
  if (!state.container) return;
  try {
    if (state.devProcess) {
      state.devProcess.kill();
      state.devProcess = null;
    }
    const scriptToRun = await pickRunScript(state.container);
    if (!scriptToRun) return;
    pushTerminal(`$ npm run ${scriptToRun}`);
    const dev = await state.container.spawn("npm", ["run", scriptToRun]);
    state.devProcess = dev;
    dev.output.pipeTo(
      new WritableStream({
        write(chunk) {
          pushTerminal(chunk);
        },
      })
    );
    setStatus("running", `Restarted npm run ${scriptToRun}\u2026`);
  } catch (err) {
    setStatus(
      "error",
      err instanceof Error ? err.message : "Restart failed"
    );
  }
}

/* ── helpers ── */

async function ensureDirsAndWrite(
  container: WebContainerType,
  path: string,
  content: string
): Promise<void> {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return;
  if (segments.length > 1) {
    const dir = segments.slice(0, -1).join("/");
    // mkdir -p
    try {
      await container.fs.mkdir(dir, { recursive: true });
    } catch {
      /* already exists */
    }
  }
  await container.fs.writeFile(path, content);
}

async function pickRunScript(
  container: WebContainerType
): Promise<string | null> {
  try {
    const raw = await container.fs.readFile("package.json", "utf-8");
    const pkg = JSON.parse(raw) as {
      scripts?: Record<string, string>;
    };
    if (pkg.scripts?.dev) return "dev";
    if (pkg.scripts?.start) return "start";
    return null;
  } catch {
    return null;
  }
}
