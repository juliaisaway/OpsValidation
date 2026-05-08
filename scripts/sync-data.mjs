import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

const sourceDir = "data";
const targetDir = "public/data";

mkdirSync(targetDir, { recursive: true });

for (const file of readdirSync(sourceDir)) {
  if (extname(file) === ".json") {
    copyFileSync(join(sourceDir, file), join(targetDir, file));
  }
}
