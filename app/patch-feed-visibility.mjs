import { readFileSync, writeFileSync } from "node:fs";

const path = "src/lib/launchpad/queries.ts";
let s = readFileSync(path, "utf8");

const launchOld = /FROM bb_launches l LEFT JOIN bb_launch_meta m ON m\.chain_id = l\.chain_id AND m\.token = l\.token\s+ORDER BY l\.block_time DESC LIMIT \$\{n\}/;
const swapOld = /JOIN bb_launches l ON l\.chain_id = s\.chain_id AND l\.token = s\.token LEFT JOIN bb_launch_meta m ON m\.chain_id = l\.chain_id AND m\.token = l\.token\s+ORDER BY s\.block_time DESC/;

if (!launchOld.test(s) || !swapOld.test(s)) {
  console.error("STOP: query tidak cocok; file tidak diubah.");
  process.exit(1);
}

s = s.replace(
  launchOld,
  "FROM bb_launches l LEFT JOIN bb_launch_meta m ON m.chain_id = l.chain_id AND m.token = l.token\n        ${LAUNCH_VISIBLE_FROM ? db`WHERE l.block_time >= ${LAUNCH_VISIBLE_FROM.toISOString()}::timestamptz` : db``}\n        ORDER BY l.block_time DESC LIMIT ${n}"
);

s = s.replace(
  swapOld,
  "JOIN bb_launches l ON l.chain_id = s.chain_id AND l.token = s.token LEFT JOIN bb_launch_meta m ON m.chain_id = l.chain_id AND m.token = l.token\n              ${LAUNCH_VISIBLE_FROM ? db`WHERE l.block_time >= ${LAUNCH_VISIBLE_FROM.toISOString()}::timestamptz AND s.block_time >= ${LAUNCH_VISIBLE_FROM.toISOString()}::timestamptz` : db``}\n              ORDER BY s.block_time DESC"
);

writeFileSync(path, s);
console.log("OK: query feed diperbarui.");
