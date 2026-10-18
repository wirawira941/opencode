# opencode for Termux (native Android)

This fork adds **native Android/Termux support** to opencode — no proot, no
container, no root required. It builds a genuine Android aarch64 binary using
Bun's official Android target, plus an Android-built `libopentui.so` for the
TUI renderer.

Upstream (`anomalyco/opencode`) does not ship Android builds: Bun only
recently gained an official Android target, and the native modules
(`@opentui/core`, `@opencode-ai/pty`) publish no Android binaries.

## What's in this fork

| Change | File |
|---|---|
| New `android` build target (`--target=opencode-android-arm64`) + correct Bun Android release-asset name | `packages/cli/script/build.ts` |
| `OPENTUI_LIB_PATH` support: lets the TUI load an Android-built `libopentui.so` (upstream has no Android prebuild and Bun reports `process.platform === "android"`) | `packages/tui/src/termux.ts`, `packages/tui/src/index.tsx` |
| CI workflow that builds everything and packages the zip | `.github/workflows/termux-android.yml` |
| Android/bionic patch for OpenTUI (adapted from guysoft/opencode-termux, MIT) | `termux/patches/opentui-android.patch` |
| Termux wrapper script + installer | `termux/bin/opencode`, `termux/install.sh` |

Known limitations:

- The `@opencode-ai/pty` native module has no Android build; the Android
  binary runs without the embedded pty (the build tolerates this).
- `@parcel/watcher` has no Android binding either — the wrapper exports
  `OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER=true`, so file watching is off
  on Termux (documented upstream env var).
- `--skip-web-ui` is used, so `opencode serve` ships without the web client
  in this build. Remove the flag in the workflow if you want it.

## Building

1. Fork this repo (or use it as-is).
2. Go to the **Actions** tab → **termux-android** → **Run workflow**.
   - `ref`: branch/tag/SHA to build (default: `termux-android`).
   - `opentui_version`: must match the `@opentui/core` version pinned in
     `package.json` (default: `0.5.17`).
   - `create_release`: attach the zip to a GitHub release.
3. Wait for the run to finish (roughly 30–60 minutes: NDK download, Zig
   build of OpenTUI, then the opencode compile).
4. Download `opencode-termux-android-aarch64.zip` from the run's artifacts
   (or from the release, if enabled).

## Installing on Termux

Requirements: Android 8.0+, arm64 device, Termux installed **from F-Droid
or GitHub** (the Play Store build is deprecated and will not work). No root.

```sh
# 1. Copy the zip to your phone and extract it in Termux, e.g.:
unzip opencode-termux-android-aarch64.zip -d ~/opencode-termux
cd ~/opencode-termux

# 2. Install:
sh install.sh

# 3. Recommended packages:
pkg install ripgrep git openssh

# 4. Run:
opencode
```

The installer puts the `opencode` wrapper on your `PATH`
(`$PREFIX/bin/opencode`) and the binary + native libraries under
`$PREFIX/libexec/opencode/`. The wrapper sets `OPENTUI_LIB_PATH`,
`LD_LIBRARY_PATH`, and disables the file watcher automatically.

Then configure an AI provider (`opencode auth login`, or export e.g.
`ANTHROPIC_API_KEY` / `OPENAI_API_KEY`).

## Troubleshooting

- **`Bad system call` / exit 159 on startup** — Android's seccomp policy used
  to trap syscalls Bun makes. Bun's official Android runtime (1.4.x) includes
  the upstream fix; if you still hit this, open an issue with your Android
  version and device model.
- **TUI shows "OpenTUI is not supported on the current platform"** — the
  wrapper wasn't used, or `OPENTUI_LIB_PATH` doesn't point at a real
  `libopentui.so`. Always launch via the `opencode` wrapper, not
  `opencode.bin` directly.
- **Patch step warns it didn't apply** — the vendored OpenTUI patch targets
  the pinned `@opentui/core` version. If `package.json` moved on, the Zig
  build is the real gate: if it succeeds, you're fine.

## Credits

- Upstream: [anomalyco/opencode](https://github.com/anomalyco/opencode)
- The Android/Termux build recipe (NDK + Zig approach, bionic `build.zig`
  adaptations, wrapper-script lessons) was pioneered by
  [guysoft/opencode-termux](https://github.com/guysoft/opencode-termux)
  (MIT). The patch in `termux/patches/` is adapted from that project; see
  its header for details.
- Bun's official Android target: [oven-sh/bun](https://github.com/oven-sh/bun)

## Build notes (from the reference VM build, 2026-10-18)

- OpenTUI 0.5.17 requires **Zig 0.16.0+** (`minimum_zig_version` in its
  `build.zig.zon`); Zig 0.15.x fails with std API errors.
- The vendored patch also skips linking `libdl` on Android (bionic keeps
  `dlopen` in libc, like `pthread`/`m`).
- `@parcel/watcher` ships no Android binding, so the CLI build needs a tiny
  stub package at `packages/core/node_modules/@parcel/watcher-android-arm64`
  (it throws on load; the upstream try/catch keeps the watcher disabled).
  The wrapper sets `OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER=true` anyway.
