/**
 * termux-android: native Android/Termux support (see TERMUX.md).
 *
 * The prebuilt @opentui/core native libraries do not ship Android builds,
 * and Bun reports `process.platform === "android"`, so the default native
 * library resolution throws "Unsupported OpenTUI Node asset target".
 *
 * When OPENTUI_LIB_PATH points at an Android-built libopentui.so, register
 * it here — this module is imported first by the TUI entrypoint, so it runs
 * before any renderer (and therefore any native load) is created.
 */
import { setRenderLibPath } from "@opentui/core"

const libPath = process.env.OPENTUI_LIB_PATH
if (libPath) {
  setRenderLibPath(libPath)
}
