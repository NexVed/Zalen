import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// Serve the worker unchanged: Babel's application transforms inject imports
// and Fast Refresh code that cannot run inside this standalone module worker.
const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve("maplibre-gl/package.json"));
const target = new URL("../public/maps/", import.meta.url);
await mkdir(target, { recursive: true });
for (const [source, output] of [
  ["dist/maplibre-gl-worker.mjs", "maplibre-worker.mjs"],
  ["LICENSE.txt", "maplibre-LICENSE.txt"],
]) {
  const content = await readFile(join(packageRoot, source));
  const destination = new URL(output, target);
  const previous = await readFile(destination).catch(() => null);
  if (!previous?.equals(content)) await writeFile(destination, content);
}
