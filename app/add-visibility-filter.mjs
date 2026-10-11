import { readFileSync, writeFileSync } from "node:fs";

const path = "src/lib/launchpad/queries.ts";
let text = readFileSync(path, "utf8");

const marker = "  const conds = [] as ReturnType<typeof db>[];";
const addition = marker + "\n  if (LAUNCH_VISIBLE_FROM) conds.push(db`l.block_time >= ${LAUNCH_VISIBLE_FROM.toISOString()}::timestamptz`);";

if (text.split(marker).length - 1 !== 1) {
  console.error("STOP: pola conds tidak ditemukan tepat satu kali; file tidak diubah.");
  process.exit(1);
}
if (text.includes("if (LAUNCH_VISIBLE_FROM) conds.push")) {
  console.error("STOP: filter tampaknya sudah ada; file tidak diubah.");
  process.exit(1);
}

text = text.replace(marker, addition);
writeFileSync(path, text);
console.log("OK: filter daftar launch ditambahkan.");
