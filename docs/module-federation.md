# NxModuleFederationPlugin

This plugin used default settings, and overwrites the library settings from the provided config. Need to provide `library: { type: 'var', name: 'remote_name' }` as overwrite config in the `webpack.config.ts` file. Type needs to be set to `var` to prevent a mismatch between ES module code while it is loaded as a normal script.

# Claude explanation

## What decides how the remote is loaded

The **Module Federation runtime** (`@module-federation/enhanced`) is what actually loads remote entries. In the runtime code, there's a switch on the remote's `type`:

```js
switch (type) {
  case 'esm':
  case 'module':
    // Uses: import(entry)
    return dynamicImport({ entry });
  case 'system':
    // Uses: System.import(entry)
    return systemImport({ entry });
  default:
    // Uses: loadScript() → creates <script> tag, reads global var
    return scriptLoad({ entry, globalName, name });
}
```

The `type` comes from the remote's mf-manifest.json (which your host fetches from `http://localhost:8889/mf-manifest.json`). Before our fix, the manifest had `"type": "module"`, which _should_ have triggered the `import()` path — and that would have worked fine with ESM output.

## So why did it fail?

There are two separate code paths for loading remotes:

1. **Federation runtime path** (via manifest) — respects the `type` field, can use `import()`
2. **Bundler runtime path** (`__webpack_require__.f.remotes`) — uses `loadScript()` which always creates a plain `<script>` tag

The Nx plugin wires things up through **both** paths. The bundler runtime path runs first and creates a `<script>` tag, which hits the `export` keyword and crashes before the federation runtime even gets a chance to use `import()`.

## The ESM-everywhere approach

To make ESM work end-to-end, the **host** also needs `experiments: { outputModule: true }` in its rspack config so its bundler runtime can handle ESM chunks. Let me check if that's viable here:

## What loads the remote

The **`@module-federation/runtime-core`** (bundled inside `@module-federation/enhanced`) is the library that decides how to load remote entries. It has a `loadEntryDom` function that switches on the remote's `type` from the manifest:

| `type` in manifest                        | Loading method         | Mechanism          |
| ----------------------------------------- | ---------------------- | ------------------ |
| `"module"` / `"esm"`                      | `import(entry)`        | Dynamic ESM import |
| `"system"`                                | `System.import(entry)` | SystemJS           |
| anything else (`"var"`, `"global"`, etc.) | `loadScript(entry)`    | `<script>` tag     |

So **yes, the runtime fully supports ESM loading** — when it sees `"type": "module"` in the manifest, it uses `import()`, which correctly handles `export` statements.

## Why didn't it work then?

The real issue is a conflict between the **Angular** and **Rspack** variants of the Nx plugin. There are actually two different plugin implementations:

|                          | Angular variant (`@nx/module-federation/angular`) | Rspack variant               |
| ------------------------ | ------------------------------------------------- | ---------------------------- |
| `library.type` (browser) | Hardcodes `{ type: 'module' }`                    | **Does not set it**          |
| `output.scriptType`      | Not touched                                       | **Strips `'module'`** if set |
| `output.module`          | Not touched                                       | **Strips it** if set         |

Your apps import from `@nx/module-federation/angular`, which hardcodes `library: { type: 'module' }` — emitting ESM output with `export` statements. But then **rspack's build pipeline** doesn't fully support ESM module federation. The rspack plugin variant actively strips ESM-related output settings:

```js
// rspack/nx-module-federation-plugin.js
if (compiler.options.output.scriptType === 'module') {
  compiler.options.output.scriptType = undefined;
  compiler.options.output.module = undefined;
}
```

This creates a mismatch: the remote **outputs** ESM (because the Angular plugin sets it), but the host's bundler runtime doesn't properly handle ESM remote loading (because rspack strips the ESM configuration).

## The better fix

You're right that ESM would be the cleaner approach. The current `library: { type: 'var' }` fix works but is the legacy pattern. The proper ESM fix would likely require:

1. **Using the rspack-specific MF plugin** instead of the Angular one (so it doesn't hardcode ESM in a way rspack can't handle), or
2. **Waiting for Nx to fix this incompatibility** — this looks like a bug where the Angular plugin assumes webpack but the actual bundler is rspack

This is essentially a compatibility gap in `@nx/module-federation` v22.5.0 when using Angular + Rspack. The Angular plugin was written for webpack (where `library: { type: 'module' }` + `experiments.outputModule` works seamlessly), but rspack doesn't handle that configuration the same way. Until Nx resolves this, the `type: 'var'` override is the pragmatic workaround.
