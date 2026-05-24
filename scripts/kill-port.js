/**
 * Frees a TCP port on Windows (dev stuck after crash).
 * Usage: node scripts/kill-port.js 3002
 */
const { execSync } = require("child_process");

const port = process.argv[2] || "3002";
if (!/^\d+$/.test(port)) {
  console.error("[kill-port] invalid port:", port);
  process.exit(1);
}

try {
  const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes("LISTENING")) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid)) pids.add(pid);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`[kill-port] stopped PID ${pid} on :${port}`);
    } catch {
      /* already gone */
    }
  }
  if (pids.size === 0) console.log(`[kill-port] no listener on :${port}`);
} catch {
  console.log(`[kill-port] no listener on :${port}`);
}
