type ImperiumLogLevel =
  | "DEBUG"
  | "INFO"
  | "WARN"
  | "ERROR";

type ImperiumLogData = Record<string, unknown>;

function writeLog(
  level: ImperiumLogLevel,
  message: string,
  data?: ImperiumLogData
) {
  const entry = {
    timestamp: new Date().toISOString(),
    engine: "IMPERIUM",
    level,
    message,
    ...data,
  };

  if (level === "ERROR") {
    console.error("[IMPERIUM]", entry);
    return;
  }

  if (level === "WARN") {
    console.warn("[IMPERIUM]", entry);
    return;
  }

  console.log("[IMPERIUM]", entry);
}

export const imperiumLogger = {
  debug(message: string, data?: ImperiumLogData) {
    if (process.env.NODE_ENV !== "production") {
      writeLog("DEBUG", message, data);
    }
  },

  info(message: string, data?: ImperiumLogData) {
    writeLog("INFO", message, data);
  },

  warn(message: string, data?: ImperiumLogData) {
    writeLog("WARN", message, data);
  },

  error(message: string, data?: ImperiumLogData) {
    writeLog("ERROR", message, data);
  },
};