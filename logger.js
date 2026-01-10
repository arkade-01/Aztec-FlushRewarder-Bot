import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve("./logs");
const LOG_FILE = path.join(LOG_DIR, "flush.log");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function log(message) {
  const line = `${new Date().toISOString()} | ${message}\n`;

  // Async write = non-blocking
  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) console.error("LOG_ERROR:", err.message);
  });
}
