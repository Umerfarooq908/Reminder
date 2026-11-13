import { copyFile, rm } from "node:fs/promises";

const builtTemplate = new URL("../dist/index.src.html", import.meta.url);
const builtIndex = new URL("../dist/index.html", import.meta.url);
const sourceWorker = new URL("../sw.js", import.meta.url);
const builtWorker = new URL("../dist/sw.js", import.meta.url);

await copyFile(builtTemplate, builtIndex);
await copyFile(sourceWorker, builtWorker);
await rm(builtTemplate);
