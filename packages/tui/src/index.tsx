// termux-android: runs before anything else so OPENTUI_LIB_PATH is honored
// (see ./termux.ts and TERMUX.md).
import "./termux"
export { run, type TuiInput } from "./app"
export { LogProvider, useLog, type LogLevel, type LogSink, type LogTags } from "./context/log"
