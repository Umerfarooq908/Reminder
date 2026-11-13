import { copyFile, rm } from "node:fs/promises";

const builtTemplate = new URL("../dist/index.src.html", import.meta.url);
const builtIndex = new URL("../dist/index.html", import.meta.url);

await copyFile(builtTemplate, builtIndex);
await rm(builtTemplate);
