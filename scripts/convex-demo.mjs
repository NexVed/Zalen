import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { ConvexHttpClient } from "convex/browser";

const command = process.argv[2] ?? "inspect";
const allowed = ["inspect", "codegen", "check", "deploy", "seed"];
if (!allowed.includes(command)) throw new Error(`Choose one of: ${allowed.join(", ")}`);
const values = Object.fromEntries(fs.readFileSync("server/.env", "utf8").split(/\r?\n/).filter(line => line.includes("=") && !line.trim().startsWith("#")).map(line => { const index = line.indexOf("="); return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "")]; }));
const key = values.CONVEX_DEPLOY_KEY;
const target = key?.split("|", 1)[0].match(/^(dev|prod|preview):([a-z]+-[a-z]+-\d+)$/);
if (!target || !values.CONVEX_URL) throw new Error("A deployment URL and a named deploy key are required in server/.env.");
const [, type, name] = target;
if (new URL(values.CONVEX_URL).hostname.split(".")[0] !== name) throw new Error("The deploy key and deployment URL do not match.");
console.log(`target: ${type} (${name}) · ${command}`);
if (["deploy", "seed"].includes(command) && type === "prod" && process.argv.slice(3).join(" ") !== `--confirm-production ${name}`) {
  throw new Error(`Production changes require explicit approval and --confirm-production ${name}.`);
}
if (command === "inspect") {
  const client = new ConvexHttpClient(values.CONVEX_URL);
  client.setAdminAuth(key);
  const functions = await client.query("_system/cli/modules:apiSpec", {});
  console.log(JSON.stringify({ functions: functions.map(item => item.identifier), count: functions.length }, null, 2));
} else {
  const env = { ...process.env, CONVEX_DEPLOY_KEY: key, CONVEX_DEPLOYMENT: `${type}:${name}` };
  const args = command === "codegen" ? ["codegen", "--typecheck", "enable"] : command === "check" ? ["deploy", "--dry-run", "--typecheck", "enable"] : command === "deploy" ? ["deploy", "--typecheck", "enable"] : ["run", "seed:presentable", "{}"];
  const result = spawnSync(process.execPath, ["node_modules/convex/bin/main.js", ...args], { env, stdio: "inherit" });
  process.exitCode = result.status ?? 1;
}
