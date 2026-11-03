# @module-federation/vite: the host's local copy of a shared singleton is evaluated even when a remote's version is selected

Minimal reproduction for `@module-federation/vite` 1.23.8 with `shareStrategy: 'version-first'`.

## Setup

| | `shared-elements` | Shared config |
|---|---|---|
| `host/` | 1.0.0 | `{ singleton: true }`, `shareStrategy: 'version-first'` |
| `remote/` | 1.1.0 | `{ singleton: true }` |

`packages/shared-elements-*` is a stand-in for a web-component library. At module top level it records that it was evaluated and registers a custom element:

```js
(globalThis.__sharedElementsEvaluated ||= []).push(version);
customElements.define('shared-el', SharedEl);
```

## Steps

Requires Node 20.19+ or 22.12+ and pnpm.

```sh
# terminal 1: build and serve the remote on :4174
cd remote && pnpm install && pnpm build && pnpm preview

# terminal 2: run the host on :4173 (dev server)
cd host && pnpm install && pnpm dev
# or as a production build
cd host && pnpm install && pnpm build && pnpm preview
```

Open http://localhost:4173. The host proxies `/remote/` to the remote's preview server.

## Expected

`version-first` selects 1.1.0 for the singleton, so only 1.1.0 is evaluated, and the host and remote both receive it:

```
Copies of shared-elements evaluated: ["1.1.0"]
Version the host received: 1.1.0
Version the remote received: 1.1.0
```

## Actual

Both copies are evaluated. The host's 1.0.0 is evaluated first, then the selected 1.1.0, and the second `customElements.define` throws:

```
[shared-elements] evaluated 1.0.0
[shared-elements] evaluated 1.1.0
Uncaught NotSupportedError: Failed to execute 'define' on 'CustomElementRegistry':
the name "shared-el" has already been used with this registry
```

This happens with the dev server and with a production build.

The host's 1.0.0 is evaluated even when nothing uses it. Comment out the `customElements.define` line in both `packages/shared-elements-*/index.js` and run `pnpm install --force` in `host/` and `remote/`. pnpm copies `file:` dependencies, so edits under `packages/` only reach the apps after a reinstall. The page then loads, the host and remote both receive 1.1.0, and the log still shows `["1.0.0", "1.1.0"]`.

## What the browser does

In the network log, the host loads its own `shared-elements` before it requests the remote's manifest:

1. During the host's `init()`, the host seeds the share cache with its local copy, so 1.0.0 is evaluated.
2. The remote registers 1.1.0, and `version-first` selects it as the singleton.
3. 1.1.0 is loaded and evaluated, and the host's exports rebind to it.

For a module without side effects the result is correct, and the extra evaluation of 1.0.0 goes unnoticed. For a module with top-level side effects (custom element registration, global registries, polyfills), the side effect runs twice.

The generated `loadShare` module for the shared dependency also imports the host's local copy statically. It uses that copy only when the share cache is empty, but a static import is always evaluated:

```js
import * as __mfLocalShare from "…__prebuild__…shared-elements…";

let exportModule = __mfReadSharedCache(__mfModuleCache.share, { canonical: "default:shared-elements", … });
if (exportModule === undefined) {
  exportModule = __mfNormalizeShareModule(__mfLocalShare);
  …
}
```

## Working case: host has the highest version

For comparison, change only the host's version so it matches the remote's:

```sh
cd host && pnpm remove shared-elements && pnpm add shared-elements@file:../packages/shared-elements-1.1.0
```

Only 1.1.0 is evaluated, and the page loads. The same happens whenever the host's version is the highest, because the selected copy is the host's own copy, which has already been evaluated.
