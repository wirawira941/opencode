import path from "node:path"
import fs from "node:fs"

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : undefined

// termux-android: on Android, Bun reports the dynamic linker
// (/apex/com.android.runtime/bin/linker64) as process.execPath and "bun" as
// argv[0]. /proc/self/exe points at the real binary.
function androidExecutable(): string | undefined {
  if (process.platform !== "android") return undefined
  try {
    const exe = fs.readlinkSync("/proc/self/exe")
    if (exe && exe !== process.execPath) return exe
  } catch {}
  return undefined
}

export function selfCommand() {
  const android = androidExecutable()
  if (android) return [android]
  const runtime = path.basename(process.execPath, path.extname(process.execPath)).toLowerCase()
  if (runtime !== "bun" && runtime !== "node" && runtime !== "nodejs") return [process.execPath]
  if (!entrypoint) throw new Error("Failed to resolve CLI entrypoint")
  if (runtime === "node" || runtime === "nodejs") return [process.execPath, ...nodeFlags(), entrypoint]
  return [process.execPath, entrypoint]
}

function nodeFlags() {
  return process.execArgv.flatMap((arg, index, args) => {
    if (index > 0 && args[index - 1] === "--conditions") return []
    if (arg === "--conditions") return args[index + 1] ? [arg, args[index + 1]] : []
    if (arg.startsWith("--conditions=")) return [arg]
    if (
      arg === "--experimental-ffi" ||
      arg === "--use-system-ca" ||
      arg === "--enable-source-maps" ||
      arg === "--no-addons"
    )
      return [arg]
    if (arg === "--no-warnings" || arg.startsWith("--disable-warning=")) return [arg]
    return []
  })
}
